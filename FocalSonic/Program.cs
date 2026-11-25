using FocalSonic;
using FocalSonic.AppleMusic;
using FocalSonic.AudioPlayer;
using FocalSonic.Helpers;
using FocalSonic.OverrideSystem;
using FocalSonic.Presence;
using FocalSonic.Streaming;
using FocalSonic.Windows;
using IgniteView.Core;
using IgniteView.Desktop;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Net.Http;
using WatsonWebserver.Core;
#if WINDOWS
using Windows.Services.Store;
#endif

public class Program
{
    public static ViteAppManager App;
    public static HttpClient Http = DualStackHttp.CreateClient();
    public static WebWindow? MainWindow => App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("MainWindow")).FirstOrDefault();
    public static WindowBounds DefaultBounds = new WindowBounds(1450, 900) { MinWidth = 1080, MinHeight = 750 };
    public static string LockFilePath => Path.Join(Path.GetDirectoryName(Path.GetTempPath()), "focalsonic.lock");

    /// <summary>
    /// The page the main window is on (its hash route, eg. "/library/albums/123"), so that a window
    /// closed and opened again while FocalSonic keeps running comes back on the same page.
    /// Only kept in memory: a cold start always opens on the home page.
    /// </summary>
    static volatile string? MainWindowRoute;

    [STAThread]
    static void Main(string[] args)
    {
        // Pin InvariantCulture to keep consistent number conversion
        CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
        CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;

        if (IsAnotherProcessRunning() && File.Exists(LockFilePath))
        {
            var existingAppServer = File.ReadAllText(LockFilePath);
            var showCommandURL = existingAppServer + "/dynamic/show-window";
            (new HttpClient()).GetAsync(showCommandURL).Wait();
            return; // Now the window will open on the main process
        }

        DesktopPlatformManager.Activate();
        App = new ViteAppManager();

        // Needed for background playback with Apple Music
        App.BrowserFlags.Add("--autoplay-policy=no-user-gesture-required");
        App.BrowserFlags.Add("--no-user-gesture-required");
        App.BrowserFlags.Add("--disable-features=HardwareMediaKeyHandling");

    #if LINUX
        // Qt WebEngine never settles PublicKeyCredential's availability promises, and Apple's
        // sign-in widget awaits them, leaving it half-rendered and stuck. Without WebAuthn the
        // widget falls back to password sign-in, which is all Qt WebEngine can do anyway.
        App.BrowserFlags.Add("--disable-blink-features=WebAuth");
    #endif

    #if MACOS
        App.RegisterDynamicFileRoute("/show-window", async (HttpContextBase ctx) => { FocalSonic.MacOS.MacAppLifetime.ShowMainWindow(); }, WatsonWebserver.Core.HttpMethod.GET);
    #else
        App.RegisterDynamicFileRoute("/show-window", async (HttpContextBase ctx) => { CreateMainWindow(); }, WatsonWebserver.Core.HttpMethod.GET);
    #endif

        // Allows communication with the apple music API from javascript
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.GET);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.POST);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.DELETE);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.PATCH);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.PUT);

        // Proxies for assets and streaming
        App.RegisterDynamicFileRoute("/s3imageproxy", S3ImageProxy.S3ImageProxyRoute, WatsonWebserver.Core.HttpMethod.GET);
        App.RegisterDynamicFileRoute("/impulse", ImpulseOverrides.ImpulseOverrideRoute, WatsonWebserver.Core.HttpMethod.GET);
        App.RegisterDynamicFileRoute("/streaming", StreamingProxy.StreamingProxyRoute, WatsonWebserver.Core.HttpMethod.POST);
        App.RegisterDynamicFileRoute("/streaming", StreamingProxy.StreamingProxyRoute, WatsonWebserver.Core.HttpMethod.GET);
        App.RegisterDynamicFileRoute("/streaming-atmos-v1", StreamingProxy.StreamingProxyRoute, WatsonWebserver.Core.HttpMethod.GET);

        // The page's query cache, kept here so windows opened again (and the next launch) paint straight away
        FocalSonic.Persistence.QueryCache.Setup();

        // JSON Setup
        JsonConvert.DefaultSettings = () => new JsonSerializerSettings
        {
            ContractResolver = new FocalSonicContractResolver(),
            NullValueHandling = NullValueHandling.Ignore,
            Culture = CultureInfo.InvariantCulture
        };

        // Background setup
        PlayerThread.Start();
        Presence.Setup();
        FocalSonic.ListenTogether.ListenTogether.Setup();
        OverrideManager.Setup();

    #if WINDOWS
        WPFStyling.Setup();
        TrayIcon.Setup();
    #elif LINUX
        LinuxAppLifetime.Setup();
        LinuxTrayIcon.Setup();
    #elif MACOS
        FocalSonic.MacOS.MacAppLifetime.Setup();
        FocalSonic.MacOS.MacWindowManagement.Setup();
        FocalSonic.MacOS.MacAirPlay.Setup();
    #endif

    #if MACOS
        // The run loop isn't draining autorelease pools yet. Without one, references WebKit and
        // AppKit autorelease while the window opens are never released, so once closed the window
        // and its web view (with its web content process) would live on.
        FocalSonic.MacOS.ObjC.WithAutoreleasePool(CreateMainWindow);

        // AppKit's run loop only ends if something stops it, and saucer can't start it again:
        // calling Run again would spin, leaving the app hung, so quit instead.
        App.Run();
        FocalSonic.MacOS.MacAppLifetime.Quit();
    #else
        CreateMainWindow();

        while (true)
        {
            App.Run();
        }
    #endif
    }

    // Run before entering background mode to make sure the UI is not still running
    [Command("cleanUpUI")]
    public static void CleanUpUI()
    {
        Performance.IsRunningInForeground = false;
        MainWindow?.Close();

        foreach (var window in App.OpenWindows)
        {
            window.SharedContext.Remove("MainWindow");
            window.ExecuteJavaScript("window.gc && window.gc()");
        }
    }

    /// <summary>The frontend reports each page the main window navigates to.</summary>
    [Command("setMainWindowRoute")]
    public static void SetMainWindowRoute(string route, WebWindow ctx)
    {
        // Only the current main window: one that's just been replaced by a respawn may still be reporting.
        if (ctx?.SharedContext.ContainsKey("MainWindow") != true) return;
        if (string.IsNullOrEmpty(route) || !route.StartsWith("/")) return;

        MainWindowRoute = route;
    }

    public static void CreateMainWindow()
    {
        if (MainWindow != null) { CleanUpUI(); } // Respawn the main window

        // Reopen on the page the last main window was on, if there was one since the app started.
        var route = MainWindowRoute;
        var baseURL = App.CurrentServerManager?.LocalBaseURL;

        Performance.IsRunningInForeground = true;
        App.MainWindow =
            WebWindow.Create()
            .WithTitle("FocalSonic")
            .WithBounds(DefaultBounds)
            .WithSharedContext("MainWindow", "")
            // The default URL plus the route. Given whole, because IgniteView takes any relative URL
            // with "://" in it (as a search query could have) for an absolute one.
            .With((w) => { if (route != null && !string.IsNullOrEmpty(baseURL)) w.WithURL(baseURL + "/#" + route); })
            .WithPlatformBasedAdditions()
            .Show();

        WriteLockFile();

        #if WINDOWS
        Licensing.Context = StoreContext.GetDefault();
        WinRT.Interop.InitializeWithWindow.Initialize(Licensing.Context, App.MainWindow.NativeHandle);
        #elif MACOS
        FocalSonic.MacOS.MacAppLifetime.MainWindowShown(App.MainWindow);
        #endif
    }

    public static bool IsAnotherProcessRunning()
    {
        var processes = Process.GetProcessesByName("focalsonic");
        var currentProcess = Process.GetCurrentProcess();
        foreach (var proc in processes)
        {
            if (proc != null && proc.Id != currentProcess.Id && !proc.HasExited)
            {
                return true;
            }
        }

        return false;
    }

    public static void WriteLockFile()
    {

        var serverURL = App?.CurrentServerManager?.LocalBaseURL;
        if (string.IsNullOrEmpty(serverURL)) return;

        try
        {
            File.WriteAllText(LockFilePath, serverURL);
        }
        catch { }
    }
}

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
    public static HttpClient Http = new HttpClient();
    public static WebWindow? MainWindow => App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("MainWindow")).FirstOrDefault();
    public static WindowBounds DefaultBounds = new WindowBounds(1450, 900) { MinWidth = 1080, MinHeight = 750 };
    public static string LockFilePath => Path.Join(Path.GetDirectoryName(Path.GetTempPath()), "focalsonic.lock");

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

        App.RegisterDynamicFileRoute("/show-window", async (HttpContextBase ctx) => { CreateMainWindow(); }, WatsonWebserver.Core.HttpMethod.GET);

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
        OverrideManager.Setup();

    #if WINDOWS
        WPFStyling.Setup();
        TrayIcon.Setup();
    #elif LINUX
        LinuxAppLifetime.Setup();
        LinuxTrayIcon.Setup();
    #endif

        CreateMainWindow();


        while (true)
        {
            App.Run();
        }
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

    public static void CreateMainWindow()
    {
        if (MainWindow != null) { CleanUpUI(); } // Respawn the main window

        Performance.IsRunningInForeground = true;
        App.MainWindow =
            WebWindow.Create()
            .WithTitle("FocalSonic")
            .WithBounds(DefaultBounds)
            .WithSharedContext("MainWindow", "")
            .WithPlatformBasedAdditions()
            .Show();

        WriteLockFile();

        #if WINDOWS
        Licensing.Context = StoreContext.GetDefault();
        WinRT.Interop.InitializeWithWindow.Initialize(Licensing.Context, App.MainWindow.NativeHandle);
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

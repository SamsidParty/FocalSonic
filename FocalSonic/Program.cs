using FocalSonic;
using FocalSonic.AppleMusic;
using FocalSonic.AudioPlayer;
using FocalSonic.Helpers;
using FocalSonic.OverrideSystem;
using FocalSonic.Presence;
using FocalSonic.Windows;
using IgniteView.Core;
using IgniteView.Desktop;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Net.Http;
using Windows.Services.Store;

public class Program
{
    public static ViteAppManager App;
    public static HttpClient Http = new HttpClient();
    public static WebWindow? MainWindow => App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("MainWindow")).FirstOrDefault();

    public static WindowBounds DefaultBounds = new WindowBounds(1280, 820) { MinWidth = 800, MinHeight = 450 };

    [STAThread]
    static void Main(string[] args)
    {

        // Needed for background playback with Apple Music
        Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--autoplay-policy=no-user-gesture-required --disable-features=HardwareMediaKeyHandling");

        DesktopPlatformManager.Activate();
        App = new ViteAppManager();

        // Allows communication with the apple music API from javascript
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.GET);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.POST);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.DELETE);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.PATCH);
        App.RegisterDynamicFileRoute("/applemusic", AppleMusicHttpProxy.AppleMusicHttpProxyRoute, WatsonWebserver.Core.HttpMethod.PUT);

        // JSON Setup
        JsonConvert.DefaultSettings = () => new JsonSerializerSettings
        {
            ContractResolver = new FocalSonicContractResolver(),
            NullValueHandling = NullValueHandling.Ignore
        };

        // Background setup
        PlayerThread.Start();
        Presence.Setup();
        OverrideManager.Setup();

        #if WINDOWS
        WPFStyling.Setup();
        TrayIcon.Setup();
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

        Licensing.Context = StoreContext.GetDefault();
        WinRT.Interop.InitializeWithWindow.Initialize(Licensing.Context, App.MainWindow.NativeHandle);
    }


}
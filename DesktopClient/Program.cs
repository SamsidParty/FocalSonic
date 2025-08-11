using Aonsoku;
using Aonsoku.AudioPlayer;
using Aonsoku.Presence;
using IgniteView.Core;
using IgniteView.Desktop;
using Newtonsoft.Json;

public class Program
{
    public static ViteAppManager App;
    public static HttpClient Http = new HttpClient();
    

    [STAThread]
    static void Main(string[] args)
    {
        // Needed for background playback with Apple Music
        Environment.SetEnvironmentVariable("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--autoplay-policy=no-user-gesture-required");

        DesktopPlatformManager.Activate();
        App = new ViteAppManager();

        // Background setup
        PlayerThread.Start();
        Presence.Setup();
        TrayIcon.Setup();

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
        App.OpenWindows.Where((a) => a.SharedContext.ContainsKey("MainWindow")).FirstOrDefault(App.MainWindow)?.Close();

        foreach (var window in App.OpenWindows)
        {
            window.ExecuteJavaScript("window.gc && window.gc()");
        }
    }

    public static void CreateMainWindow()
    {
        Performance.IsRunningInForeground = true;
        App.MainWindow =
            WebWindow.Create()
            .WithTitle("Aonsoku")
            .WithSharedContext("MainWindow", "")
            .WithoutTitleBar()
            .Show();
    }


}
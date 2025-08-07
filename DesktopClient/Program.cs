using Aonsoku.AudioPlayer;
using IgniteView.Core;
using IgniteView.Desktop;
using Newtonsoft.Json;

public class Program
{
    public static ViteAppManager App;
    

    [STAThread]
    static void Main(string[] args)
    {
        DesktopPlatformManager.Activate();
        App = new ViteAppManager();

        App.RegisterPreloadScriptFromString("window.platformHints = " + JsonConvert.SerializeObject(PlatformManager.PlatformHints));

        // Background setup
        PlayerThread.Start();
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
        App.OpenWindows.FirstOrDefault(App.MainWindow)?.Close();
    }

    public static void CreateMainWindow()
    {
        App.MainWindow =
            WebWindow.Create()
            .WithTitle("Aonsoku")
            .WithoutTitleBar()
            .Show();
    }


}
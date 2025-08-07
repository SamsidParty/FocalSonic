using Aonsoku.AudioPlayer;
using IgniteView.Core;
using IgniteView.Desktop;

public class Program
{
    public static ViteAppManager App;
    

    [STAThread]
    static void Main(string[] args)
    {
        DesktopPlatformManager.Activate();
        App = new ViteAppManager();

        // Background setup
        PlayerThread.Start();
        TrayIcon.Setup();

        CreateMainWindow();

        while (true)
        {
            App.Run();
            App.MainWindow?.Close(); // Cleans up webview junk in RAM
        }
    }

    public static void CreateMainWindow()
    {
        var mainWindow =
            WebWindow.Create()
            .WithTitle("Aonsoku")
            .Show();
    }


}
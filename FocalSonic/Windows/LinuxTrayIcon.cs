#if LINUX

using System.Diagnostics;
using System.Runtime.InteropServices;

namespace FocalSonic.Windows
{
    public static class LinuxTrayIcon
    {
        private const int AppIndicatorCategoryApplicationStatus = 0;
        private const int AppIndicatorStatusActive = 1;

        private static readonly string[] AppIndicatorLibraries =
        [
            "libayatana-appindicator3.so.1",
            "libayatana-appindicator3.so",
            "libappindicator3.so.1",
            "libappindicator3.so"
        ];

        private static readonly GtkMenuItemActivateCallback ShowMenuItemActivatedCallback = OnShowMenuItemActivated;
        private static readonly GtkMenuItemActivateCallback QuitMenuItemActivatedCallback = OnQuitMenuItemActivated;
        private static readonly GtkStatusIconActivateCallback StatusIconActivatedCallback = OnStatusIconActivated;
        private static readonly GtkStatusIconPopupMenuCallback StatusIconPopupMenuCallback = OnStatusIconPopupMenu;

        private static Thread? trayThread;
        private static IntPtr gtkLibrary;
        private static IntPtr gObjectLibrary;
        private static IntPtr appIndicatorLibrary;
        private static IntPtr trayMenu;

        private static GtkInitCheck? gtkInitCheck;
        private static GtkMain? gtkMain;
        private static GtkMainQuit? gtkMainQuit;
        private static GtkMenuNew? gtkMenuNew;
        private static GtkMenuItemNewWithLabel? gtkMenuItemNewWithLabel;
        private static GtkSeparatorMenuItemNew? gtkSeparatorMenuItemNew;
        private static GtkMenuShellAppend? gtkMenuShellAppend;
        private static GtkWidgetShowAll? gtkWidgetShowAll;
        private static GtkMenuPopup? gtkMenuPopup;
        private static GtkStatusIconNewFromFile? gtkStatusIconNewFromFile;
        private static GtkStatusIconSetTooltipText? gtkStatusIconSetTooltipText;
        private static GtkStatusIconSetVisible? gtkStatusIconSetVisible;
        private static GSignalConnectData? gSignalConnectData;

        public static void Setup()
        {
            if (trayThread != null) return;

            trayThread = new Thread(RunTrayLoop)
            {
                IsBackground = false,
                Name = "FocalSonic Linux Tray"
            };
            trayThread.Start();
        }

        private static void RunTrayLoop()
        {
            try
            {
                if (!LoadGtk()) return;
                if (gtkInitCheck == null || gtkMain == null) return;
                if (!gtkInitCheck(IntPtr.Zero, IntPtr.Zero)) return;

                trayMenu = CreateMenu();
                gtkWidgetShowAll?.Invoke(trayMenu);

                var iconPath = GetIconPath();
                if (!TrySetupAppIndicator(iconPath) && !TrySetupStatusIcon(iconPath))
                {
                    return;
                }

                gtkMain();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to set up Linux tray icon: {ex}");
            }
        }

        private static bool LoadGtk()
        {
            if (!NativeLibrary.TryLoad("libgtk-3.so.0", out gtkLibrary)) return false;
            if (!NativeLibrary.TryLoad("libgobject-2.0.so.0", out gObjectLibrary)) return false;

            gtkInitCheck = GetDelegate<GtkInitCheck>(gtkLibrary, "gtk_init_check");
            gtkMain = GetDelegate<GtkMain>(gtkLibrary, "gtk_main");
            gtkMainQuit = GetDelegate<GtkMainQuit>(gtkLibrary, "gtk_main_quit");
            gtkMenuNew = GetDelegate<GtkMenuNew>(gtkLibrary, "gtk_menu_new");
            gtkMenuItemNewWithLabel = GetDelegate<GtkMenuItemNewWithLabel>(gtkLibrary, "gtk_menu_item_new_with_label");
            gtkSeparatorMenuItemNew = GetDelegate<GtkSeparatorMenuItemNew>(gtkLibrary, "gtk_separator_menu_item_new");
            gtkMenuShellAppend = GetDelegate<GtkMenuShellAppend>(gtkLibrary, "gtk_menu_shell_append");
            gtkWidgetShowAll = GetDelegate<GtkWidgetShowAll>(gtkLibrary, "gtk_widget_show_all");
            gtkMenuPopup = GetDelegate<GtkMenuPopup>(gtkLibrary, "gtk_menu_popup");
            gtkStatusIconNewFromFile = GetDelegate<GtkStatusIconNewFromFile>(gtkLibrary, "gtk_status_icon_new_from_file");
            gtkStatusIconSetTooltipText = GetDelegate<GtkStatusIconSetTooltipText>(gtkLibrary, "gtk_status_icon_set_tooltip_text");
            gtkStatusIconSetVisible = GetDelegate<GtkStatusIconSetVisible>(gtkLibrary, "gtk_status_icon_set_visible");
            gSignalConnectData = GetDelegate<GSignalConnectData>(gObjectLibrary, "g_signal_connect_data");

            return true;
        }

        private static IntPtr CreateMenu()
        {
            if (gtkMenuNew == null || gtkMenuItemNewWithLabel == null || gtkSeparatorMenuItemNew == null || gtkMenuShellAppend == null)
            {
                return IntPtr.Zero;
            }

            var menu = gtkMenuNew();
            var showItem = gtkMenuItemNewWithLabel("Show FocalSonic");
            var separatorItem = gtkSeparatorMenuItemNew();
            var quitItem = gtkMenuItemNewWithLabel("Quit");

            gtkMenuShellAppend(menu, showItem);
            gtkMenuShellAppend(menu, separatorItem);
            gtkMenuShellAppend(menu, quitItem);

            Connect(showItem, "activate", ShowMenuItemActivatedCallback);
            Connect(quitItem, "activate", QuitMenuItemActivatedCallback);

            return menu;
        }

        private static bool TrySetupAppIndicator(string iconPath)
        {
            if (trayMenu == IntPtr.Zero) return false;
            if (!TryLoadAppIndicatorLibrary()) return false;

            var iconName = Path.GetFileNameWithoutExtension(iconPath);
            var iconThemePath = Path.GetDirectoryName(iconPath) ?? AppDomain.CurrentDomain.BaseDirectory;
            var appIndicatorNewWithPath = TryGetDelegate<AppIndicatorNewWithPath>(appIndicatorLibrary, "app_indicator_new_with_path");
            var appIndicatorNew = TryGetDelegate<AppIndicatorNew>(appIndicatorLibrary, "app_indicator_new");
            var appIndicatorSetIconThemePath = TryGetDelegate<AppIndicatorSetIconThemePath>(appIndicatorLibrary, "app_indicator_set_icon_theme_path");
            var appIndicatorSetTitle = TryGetDelegate<AppIndicatorSetTitle>(appIndicatorLibrary, "app_indicator_set_title");
            var appIndicatorSetStatus = TryGetDelegate<AppIndicatorSetStatus>(appIndicatorLibrary, "app_indicator_set_status");
            var appIndicatorSetMenu = TryGetDelegate<AppIndicatorSetMenu>(appIndicatorLibrary, "app_indicator_set_menu");

            if (appIndicatorSetStatus == null || appIndicatorSetMenu == null) return false;

            var indicator = appIndicatorNewWithPath != null
                ? appIndicatorNewWithPath("focalsonic", iconName, AppIndicatorCategoryApplicationStatus, iconThemePath)
                : appIndicatorNew?.Invoke("focalsonic", iconName, AppIndicatorCategoryApplicationStatus) ?? IntPtr.Zero;

            if (indicator == IntPtr.Zero) return false;

            appIndicatorSetIconThemePath?.Invoke(indicator, iconThemePath);
            appIndicatorSetTitle?.Invoke(indicator, "FocalSonic");
            appIndicatorSetMenu(indicator, trayMenu);
            appIndicatorSetStatus(indicator, AppIndicatorStatusActive);

            return true;
        }

        private static bool TrySetupStatusIcon(string iconPath)
        {
            if (trayMenu == IntPtr.Zero || gtkStatusIconNewFromFile == null || gtkStatusIconSetVisible == null) return false;

            var statusIcon = gtkStatusIconNewFromFile(iconPath);
            if (statusIcon == IntPtr.Zero) return false;

            gtkStatusIconSetTooltipText?.Invoke(statusIcon, "FocalSonic");
            Connect(statusIcon, "activate", StatusIconActivatedCallback);
            Connect(statusIcon, "popup-menu", StatusIconPopupMenuCallback);
            gtkStatusIconSetVisible(statusIcon, true);

            return true;
        }

        private static bool TryLoadAppIndicatorLibrary()
        {
            foreach (var libraryName in AppIndicatorLibraries)
            {
                if (NativeLibrary.TryLoad(libraryName, out appIndicatorLibrary)) return true;
            }

            return false;
        }

        private static string GetIconPath()
        {
            var runtimePngIcon = Path.Join(AppDomain.CurrentDomain.BaseDirectory, "iv2runtime", "focalsonic-tray.png");
            if (File.Exists(runtimePngIcon)) return runtimePngIcon;

            return Path.Join(AppDomain.CurrentDomain.BaseDirectory, "iv2runtime", "favicon.ico");
        }

        private static void Connect(IntPtr instance, string signal, Delegate callback)
        {
            if (gSignalConnectData == null || instance == IntPtr.Zero) return;

            var callbackPointer = Marshal.GetFunctionPointerForDelegate(callback);
            gSignalConnectData(instance, signal, callbackPointer, IntPtr.Zero, IntPtr.Zero, 0);
        }

        private static T GetDelegate<T>(IntPtr library, string symbolName) where T : Delegate
        {
            return Marshal.GetDelegateForFunctionPointer<T>(NativeLibrary.GetExport(library, symbolName));
        }

        private static T? TryGetDelegate<T>(IntPtr library, string symbolName) where T : Delegate
        {
            return NativeLibrary.TryGetExport(library, symbolName, out var symbol)
                ? Marshal.GetDelegateForFunctionPointer<T>(symbol)
                : null;
        }

        private static void OnShowMenuItemActivated(IntPtr menuItem, IntPtr userData)
        {
            ShowMainWindow();
        }

        private static void OnQuitMenuItemActivated(IntPtr menuItem, IntPtr userData)
        {
            gtkMainQuit?.Invoke();
            Environment.Exit(0);
        }

        private static void OnStatusIconActivated(IntPtr statusIcon, IntPtr userData)
        {
            ShowMainWindow();
        }

        private static void OnStatusIconPopupMenu(IntPtr statusIcon, uint button, uint activateTime, IntPtr userData)
        {
            gtkMenuPopup?.Invoke(trayMenu, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero, button, activateTime);
        }

        private static void ShowMainWindow()
        {
            _ = Program.App.InvokeOnMainThread(Program.CreateMainWindow);
        }

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        [return: MarshalAs(UnmanagedType.I1)]
        private delegate bool GtkInitCheck(IntPtr argc, IntPtr argv);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkMain();

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkMainQuit();

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr GtkMenuNew();

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr GtkMenuItemNewWithLabel([MarshalAs(UnmanagedType.LPUTF8Str)] string label);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr GtkSeparatorMenuItemNew();

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkMenuShellAppend(IntPtr menuShell, IntPtr child);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkWidgetShowAll(IntPtr widget);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkMenuPopup(IntPtr menu, IntPtr parentMenuShell, IntPtr parentMenuItem, IntPtr menuPositionFunction, IntPtr data, uint button, uint activateTime);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr GtkStatusIconNewFromFile([MarshalAs(UnmanagedType.LPUTF8Str)] string filename);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkStatusIconSetTooltipText(IntPtr statusIcon, [MarshalAs(UnmanagedType.LPUTF8Str)] string text);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkStatusIconSetVisible(IntPtr statusIcon, [MarshalAs(UnmanagedType.I1)] bool visible);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate ulong GSignalConnectData(IntPtr instance, [MarshalAs(UnmanagedType.LPUTF8Str)] string detailedSignal, IntPtr handler, IntPtr data, IntPtr destroyData, int connectFlags);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr AppIndicatorNew([MarshalAs(UnmanagedType.LPUTF8Str)] string id, [MarshalAs(UnmanagedType.LPUTF8Str)] string iconName, int category);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate IntPtr AppIndicatorNewWithPath([MarshalAs(UnmanagedType.LPUTF8Str)] string id, [MarshalAs(UnmanagedType.LPUTF8Str)] string iconName, int category, [MarshalAs(UnmanagedType.LPUTF8Str)] string iconThemePath);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void AppIndicatorSetIconThemePath(IntPtr indicator, [MarshalAs(UnmanagedType.LPUTF8Str)] string iconThemePath);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void AppIndicatorSetTitle(IntPtr indicator, [MarshalAs(UnmanagedType.LPUTF8Str)] string title);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void AppIndicatorSetStatus(IntPtr indicator, int status);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void AppIndicatorSetMenu(IntPtr indicator, IntPtr menu);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkMenuItemActivateCallback(IntPtr menuItem, IntPtr userData);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkStatusIconActivateCallback(IntPtr statusIcon, IntPtr userData);

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void GtkStatusIconPopupMenuCallback(IntPtr statusIcon, uint button, uint activateTime, IntPtr userData);
    }
}

#endif

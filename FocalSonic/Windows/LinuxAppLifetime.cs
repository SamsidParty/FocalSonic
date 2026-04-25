#if LINUX

using System.Diagnostics;
using System.Runtime.InteropServices;

namespace FocalSonic.Windows
{
    public static class LinuxAppLifetime
    {
        private const string QtGuiLibrary = "libQt6Gui.so.6";
        private const string SetQuitOnLastWindowClosedSymbol = "_ZN15QGuiApplication25setQuitOnLastWindowClosedEb";

        public static void Setup()
        {
            try
            {
                if (!NativeLibrary.TryLoad(QtGuiLibrary, out var qtGuiLibrary)) return;
                if (!NativeLibrary.TryGetExport(qtGuiLibrary, SetQuitOnLastWindowClosedSymbol, out var symbol)) return;

                var setQuitOnLastWindowClosed = Marshal.GetDelegateForFunctionPointer<SetQuitOnLastWindowClosedDelegate>(symbol);
                setQuitOnLastWindowClosed(false);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Failed to configure Linux app lifetime: {ex}");
            }
        }

        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        private delegate void SetQuitOnLastWindowClosedDelegate([MarshalAs(UnmanagedType.I1)] bool quitOnLastWindowClosed);
    }
}

#endif

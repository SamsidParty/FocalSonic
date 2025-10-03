using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Helpers
{
    public class ErrorHandler
    {
        #if WINDOWS
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        private static extern int MessageBox(IntPtr hWnd, String text, String caption, uint type);
        #endif

        [Command("displayError")]
        public static void DisplayError(string title, string message)
        {
            Console.WriteLine($"[Error] {title}: {message}");

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // Display message box
                MessageBox(IntPtr.Zero, message, title, 0);

            }
            //TODO: Other platforms
        }
    }
}

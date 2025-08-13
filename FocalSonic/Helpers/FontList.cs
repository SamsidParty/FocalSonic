using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Drawing.Text;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Helpers
{
    public class FontList
    {
        [Command("getInstalledFonts")]
        public static List<string> GetInstalledFonts()
        {
            var fonts = new List<string>() { "System" };

            if (PlatformManager.HasPlatformHint("win32"))
            {
                InstalledFontCollection installedFontCollection = new InstalledFontCollection();
                var fontFamilies = installedFontCollection.Families;
                fonts.AddRange(fontFamilies.Select((f) => f.Name));
            }

            return fonts;
        }
    }
}

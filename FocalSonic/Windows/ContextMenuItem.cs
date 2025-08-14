using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Windows
{
    public class ContextMenuItem
    {
        public bool IsEnabled = true;
        public bool IsSeparator = false;

        public string Title;
        public string ID;
        public ContextMenuItem[] Children;
    }
}

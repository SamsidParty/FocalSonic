using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace FocalSonic.Windows
{
    public class WPFStyling
    {
        public static ResourceDictionary Fluent;
        public static Application App;

        public static void Setup()
        {
            if (App == null)
            {
                App = new Application() { ShutdownMode = ShutdownMode.OnExplicitShutdown };
                Fluent = new ResourceDictionary
                {
                    Source = new Uri("pack://application:,,,/PresentationFramework.Fluent;component/Themes/Fluent.xaml")
                };
            }

            App.Resources.MergedDictionaries.Clear();
            App.Resources.MergedDictionaries.Add(Fluent);
        }
    }
}

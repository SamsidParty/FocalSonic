using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using System.Xml.Linq;
using IgniteView.Core;
using Newtonsoft.Json;

namespace FocalSonic.Windows
{
    public class NativeContextMenu
    {

        public static void ApplyStyles(ItemsControl menu)
        {
            if (menu == null) return;

            TextOptions.SetTextFormattingMode(menu, TextFormattingMode.Display);
            TextOptions.SetTextRenderingMode(menu, TextRenderingMode.ClearType);
            TextOptions.SetTextHintingMode(menu, TextHintingMode.Animated);

            WPFStyling.Setup();
            menu.UseLayoutRounding = true;
        }


        public static async Task<string> SpawnContextMenu(ContextMenuData data)
        {
            TaskCompletionSource<string> promise = new TaskCompletionSource<string>();

            ContextMenu contextMenu = RenderRoot(data.Items, promise);
            contextMenu.Placement = PlacementMode.MousePoint;
            ApplyStyles(contextMenu);


            contextMenu.IsOpen = true;
            contextMenu.Closed += async delegate (object sender, RoutedEventArgs e)
            {
                if (!promise.Task.IsCompleted)
                {
                    promise.SetResult("cancelled");
                }
            };

            return await promise.Task;
        }

        [Command("spawnContextMenu")]
        public static async Task<string> SpawnContextMenu(string data)
        {
            return await SpawnContextMenu(JsonConvert.DeserializeObject<ContextMenuData>(data));
        }

        public static ContextMenu RenderRoot(ContextMenuItem[] children, TaskCompletionSource<string> promise)
        {
            ContextMenu contextMenu = new ContextMenu();

            ApplyStyles(contextMenu);

            foreach (ContextMenuItem item in children)
            {
                contextMenu.Items.Add(RenderItem(item, promise));
            }

            return contextMenu;
        }


        public static Control RenderItem(ContextMenuItem item, TaskCompletionSource<string> promise)
        {
            if (item.IsSeparator) return new Separator();

            MenuItem menuItem = new MenuItem
            {
                Header = item.Title,
                IsEnabled = item.IsEnabled,
                VerticalContentAlignment = VerticalAlignment.Center
            };

            ApplyStyles(menuItem);

            if (item.Children == null || item.Children.Length == 0)
            {
                menuItem.Click += delegate (object sender, RoutedEventArgs e)
                {
                    promise.SetResult(item.ID);
                };
            }
            else
            {
                foreach (ContextMenuItem item2 in item.Children)
                {
                    menuItem.Items.Add(RenderItem(item2, promise));
                }
            }
            return menuItem;
        }

    }
}

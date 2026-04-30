using IgniteView.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

#if WINDOWS
using Windows.Services.Store;
#endif

namespace FocalSonic
{
    public class Licensing
    {
        public static string ProductID = "9PMT4RKHPXCR"; // 9PMT4RKHPXCR

        #if WINDOWS
        public static StoreContext Context;
        #endif

        public static bool HasPurchasedLicense = false;

        [Command("licenseCheck")]
        public static async Task<int> LicenseCheck()
        {
            #if WINDOWS
            if (HasPurchasedLicense) return -1; // Infinite remaining free trial days

            try
            {
                var licenses = await Context.GetStoreProductsAsync(["Durable", "Consumable"], [ProductID]); // Product ID as well as trial IDs
                foreach (var license in licenses.Products)
                {
                    if (license.Value.IsInUserCollection)
                    {
                        HasPurchasedLicense = true;
                        return -1; // Infinite remaining free trial days
                    }
                }
            }
            catch { }

            // If no license is valid, get remaining free trial days
            var trialActivationTime = 0l;
            try
            {
                trialActivationTime = long.Parse(LocalStorage.GetItem("freetrial", "licensing").Result);
            }
            catch
            {
                // Begin free trial
                trialActivationTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                LocalStorage.SetItem("freetrial", trialActivationTime.ToString(), "licensing");
            }

            // Get number of days since trial activation
            var elapsedDays = (DateTimeOffset.UtcNow.ToUnixTimeSeconds() - trialActivationTime) / 86400;
            return (int)Math.Max(0, 7 - elapsedDays); // Return number of remaining free trial days (7-day trial)
            #else
            return -1;
            #endif
        }

        [Command("getPremiumPrice")]
        public static async Task<string> GetPremiumPrice()
        {
            #if WINDOWS
            try
            {
                var addOns = await Context.GetStoreProductsAsync(new string[] { "Durable", "Consumable" }, new string[] { ProductID });
                if (addOns.Products.ContainsKey(ProductID))
                {
                    return addOns.Products[ProductID].Price.FormattedPrice;
                }
            }
            catch (Exception ex) { }

            return "";
            #else
            return "Unsupported platform";
            #endif

        }

        #if WINDOWS
        [Command("purchaseLicense")]
        public static async Task PurchaseLicense()
        {
            try
            {
                var results = await Context.RequestPurchaseAsync(ProductID);

                if (results.Status == StorePurchaseStatus.Succeeded)
                {
                    HasPurchasedLicense = true;
                }
            }
            catch (Exception ex) { }
        }
        #endif
    }
}

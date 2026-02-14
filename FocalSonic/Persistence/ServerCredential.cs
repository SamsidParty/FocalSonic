#pragma warning disable CS8618

using IgniteView.Core;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Persistence
{
    public class ServerCredential
    {
        [JsonProperty("id")] public string ID { get; set; } = "0";
        [JsonProperty("serverType")] public string ServerType { get; set; } // EG. "subsonic" or "applemusic"
        [JsonProperty("authType")] public string AuthType { get; set; } // "password" or "token"
        [JsonProperty("protocolVersion")] public string ProtocolVersion { get; set; } = "1.16.0"; // For subsonic
        [JsonProperty("url")] public string URL { get; set; } // When using apple music, this is just set to "applemusic"
        [JsonProperty("username")] public string Username { get; set; } // When using apple music, this is just set to "Apple Music"
        [JsonProperty("password")] public string Password { get; set; } // When using apple music, this is the media user token
        [JsonProperty("developerToken")] public string DeveloperToken { get; set; } // Apple music only
        [JsonProperty("region")] public string Region { get; set; } // Apple music only

        public ServerCredential() { }
        public ServerCredential(string id) { this.ID = id; }

        public void Save()
        {
            if (string.IsNullOrEmpty(ID)) return;
            LocalStorage.SetItem("credentials", JsonConvert.SerializeObject(this), $"profile_{ID}");
        }

        public void Delete()
        {
            if (string.IsNullOrEmpty(ID)) return;
            LocalStorage.RemoveItem("credentials", $"profile_{ID}");
        }

        public static ServerCredential? GetByID(string id)
        {
            try
            {
                var data = LocalStorage.GetItem("credentials", $"profile_{id}");

                if (!string.IsNullOrEmpty(data))
                {
                    return JsonConvert.DeserializeObject<ServerCredential>(data);
                }
            }
            catch { }

            return null;
        }

        [Command("getCurrentCredentials")]
        public static ServerCredential GetCurrent()
        {
            var currentID = "0";
            var currentCredentials = GetByID(currentID);

            // Try to migrate credentials from the old format
            try
            {
                if (currentCredentials == null && !string.IsNullOrEmpty(LocalStorage.GetItem("applemusic_media_user_token", "default")))
                {
                    var newCredentials = new ServerCredential(currentID);
                    newCredentials.ServerType = "applemusic";
                    newCredentials.AuthType = "token";
                    newCredentials.URL = "applemusic";
                    newCredentials.Username = "Apple Music";
                    newCredentials.Password = LocalStorage.GetItem("applemusic_media_user_token", "default");
                    newCredentials.DeveloperToken = LocalStorage.GetItem("applemusic_developer_token", "default");
                    newCredentials.Region = LocalStorage.GetItem("applemusic_region", "default");
                    newCredentials.Save();

                    // Delete the old ones
                    LocalStorage.RemoveItem("applemusic_media_user_token", "default");
                    LocalStorage.RemoveItem("applemusic_developer_token", "default");
                    LocalStorage.RemoveItem("applemusic_region", "default");

                    return newCredentials;
                }
            }
            catch { }

            return currentCredentials ?? new ServerCredential(currentID);
        }

        [Command("overwriteCurrentCredentials")]
        public static void OverwriteCurrentCredentials(string credentialData)
        {
            var creds = JsonConvert.DeserializeObject<ServerCredential>(credentialData);
            creds.ID = GetCurrent().ID;
            creds.Save();
        }

        [Command("deleteCurrentCredentials")]
        public static void DeleteCurrentCredentials() { GetCurrent().Delete(); }

        public static bool DoesCredentialExist(string id)
        {
            try
            {
                var credential = GetByID(id);
                return credential != null && !string.IsNullOrEmpty(credential.ID);
            }
            catch {}

            return false;
        }
    }
}

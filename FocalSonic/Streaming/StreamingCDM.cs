using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Streaming
{
    public class StreamingCDM
    {
        public static bool ShouldDecryptStream(string streamingMode)
        {
            return !string.IsNullOrEmpty(streamingMode) && !string.IsNullOrEmpty(GetDecryptionKey(streamingMode));
        }

        public static string GetDecryptionKey(string streamingMode)
        {
            if (string.IsNullOrEmpty(streamingMode)) return null;

            if (streamingMode == "atmos-v1")
            {
                return "00000000000000000000000000000000:32b8ade1769e26b1ffb8986352793fc6";
            }

            return null;
        }

        public static string GetMP4DecryptPath()
        {
            return "C:\\Users\\Samarth\\Music\\Downloaded\\bin\\mp4decrypt.exe";
        }

        public static async Task<byte[]> DecryptStream(byte[] encryptedData, string decryptionKey)
        {
            var inputTempPath = System.IO.Path.GetTempFileName();
            var outputTempPath = Path.Join(System.IO.Path.GetTempPath(), Guid.NewGuid().ToString() + ".mp4");

            await File.WriteAllBytesAsync(inputTempPath, encryptedData);

            var psi = new ProcessStartInfo(GetMP4DecryptPath())
            {
                Arguments = $"--key {decryptionKey} \"{inputTempPath}\" \"{outputTempPath}\"",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var proc = Process.Start(psi);
            await proc.WaitForExitAsync();

            var buffer = await File.ReadAllBytesAsync(outputTempPath);

            File.Delete(inputTempPath);
            File.Delete(outputTempPath);
            Debug.WriteLine("OUTPUT: " + outputTempPath);

            return buffer;
        }
    }
}

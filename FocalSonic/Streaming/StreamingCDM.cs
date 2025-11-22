using System;
using System.Buffers;
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

        public static void FixKeyId(string inputPath)
        {
            const int bufferSize = 4096;
            byte[] buffer = ArrayPool<byte>.Shared.Rent(bufferSize);

            try
            {
                using var fs = new FileStream(inputPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
                int count = 0;

                int bytesRead;
                while ((bytesRead = fs.Read(buffer, 0, bufferSize)) > 0)
                {
                    long blockStart = fs.Position - bytesRead;
                    int searchIndex = 0;

                    while (true)
                    {
                        // Inline span-based search for "tenc"
                        int found = buffer.AsSpan(0, bytesRead)[searchIndex..].IndexOf("tenc"u8);
                        if (found < 0)
                            break;

                        int tencIndex = searchIndex + found;
                        int kidOffset = tencIndex + 12;

                        fs.Seek(blockStart + kidOffset, SeekOrigin.Begin);

                        string hex = count.ToString("D32");
                        byte[] hexBytes = Convert.FromHexString(hex);
                        fs.Write(hexBytes);

                        count++;
                        searchIndex = kidOffset + 1;
                    }

                    fs.Seek(blockStart + bytesRead, SeekOrigin.Begin);
                }
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        }



        public static string GetMP4DecryptPath()
        {
            return @"C:\Users\Samarth\Music\Downloaded\bin\mp4decrypt.exe";
        }

        public static string GetYTDLPPath()
        {
            return @"C:\Users\Samarth\Downloads\a\yt-dlp.exe";
        }

        public static async Task<string> DownloadStream(string streamURL)
        {
            var outputTempPath = System.IO.Path.GetTempFileName();

            var psi = new ProcessStartInfo(GetYTDLPPath())
            {
                Arguments = $"--allow-unplayable-formats --force-overwrites --fixup never --use-extractors generic -o \"{outputTempPath}\" \"{streamURL}\"",
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var proc = Process.Start(psi);
            await proc.WaitForExitAsync();

            return outputTempPath;
        }


        public static async Task<byte[]> DecryptStream(string encryptedFilePath, string decryptionKey)
        {
            var inputTempPath = System.IO.Path.GetTempFileName();
            var outputTempPath = Path.Join(System.IO.Path.GetTempPath(), Guid.NewGuid().ToString() + ".mp4");

            var psi = new ProcessStartInfo(GetMP4DecryptPath())
            {
                Arguments = $"--key 00000000000000000000000000000001:{""} --key {decryptionKey} \"{encryptedFilePath}\" \"{outputTempPath}\"",
                UseShellExecute = false,
                CreateNoWindow = true
            };

            FixKeyId(encryptedFilePath);
            var proc = Process.Start(psi);
            await proc.WaitForExitAsync();

            var buffer = await File.ReadAllBytesAsync(outputTempPath);

            File.Delete(inputTempPath);
            File.Delete(outputTempPath);
            System.Diagnostics.Debug.WriteLine("INPUT: " + outputTempPath);
            System.Diagnostics.Debug.WriteLine("OUTPUT: " + outputTempPath);

            return buffer;
        }


        private static void Debug(object sender, DataReceivedEventArgs e)
        {
            System.Diagnostics.Debug.WriteLine("[FocalMK] " + e.Data);
        }
    }
}

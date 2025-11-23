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


        public static string GetDecryptionKey(string streamingMode)
        {
            if (string.IsNullOrEmpty(streamingMode)) return null;

            if (streamingMode == "atmos-v1")
            {
                return "00000000000000000000000000000000:32b8ade1769e26b1ffb8986352793fc6";
            }

            return null;
        }

        public static byte[] FixAtmosKeyId(byte[] inData)
        {
            const int bufferSize = 4096;
            byte[] buffer = ArrayPool<byte>.Shared.Rent(bufferSize);

            try
            {
                using var ms = new MemoryStream(inData);
                int count = 0;

                int bytesRead;
                while ((bytesRead = ms.Read(buffer, 0, bufferSize)) > 0)
                {
                    long blockStart = ms.Position - bytesRead;
                    int searchIndex = 0;

                    while (true)
                    {
                        // Inline span-based search for "tenc"
                        int found = buffer.AsSpan(0, bytesRead)[searchIndex..].IndexOf("tenc"u8);
                        if (found < 0)
                            break;

                        int tencIndex = searchIndex + found;
                        int kidOffset = tencIndex + 12;

                        ms.Seek(blockStart + kidOffset, SeekOrigin.Begin);

                        string hex = count.ToString("D32");
                        byte[] hexBytes = Convert.FromHexString(hex);
                        ms.Write(hexBytes);

                        count++;
                        searchIndex = kidOffset + 1;
                    }

                    ms.Seek(blockStart + bytesRead, SeekOrigin.Begin);
                }

                ms.Seek(0, SeekOrigin.Begin);
                return ms.ToArray();
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        }
    }
}

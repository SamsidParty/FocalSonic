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

        public static byte[] FixAtmosKeyId(byte[] inData, List<string> keyMap)
        {
            const int bufferSize = 4096;
            byte[] buffer = ArrayPool<byte>.Shared.Rent(bufferSize);

            int keyIndex = 0;

            try
            {
                using var ms = new MemoryStream(inData);
                int bytesRead;

                while ((bytesRead = ms.Read(buffer, 0, bufferSize)) > 0)
                {
                    long blockStart = ms.Position - bytesRead;
                    int searchIndex = 0;

                    while (true)
                    {
                        // Find "tenc"
                        int found = buffer.AsSpan(0, bytesRead)[searchIndex..].IndexOf("tenc"u8);
                        if (found < 0)
                            break;

                        int tencIndex = searchIndex + found;

                        // KID is always at tenc + 12
                        int kidOffset = tencIndex + 12;
                        long kidPos = blockStart + kidOffset;

                        // Read the 16-byte KID
                        ms.Seek(kidPos, SeekOrigin.Begin);
                        Span<byte> kidBytes = stackalloc byte[16];
                        ms.Read(kidBytes);

                        // Convert to lowercase hex for dictionary lookup
                        string oldKidHex = Convert.ToHexString(kidBytes).ToLowerInvariant();

                        byte[] newKidBytes = (keyMap.Count > keyIndex) ? Convert.FromHexString(keyMap[keyIndex]) : Convert.FromHexString("000000000000000073312f6531202020");  // Default key for Atmos streams
                        keyIndex++;

                        Debug.WriteLine($"[StreamingProxy][Dolby Atmos] Replacing key id {oldKidHex} -> {Convert.ToHexString(newKidBytes)}");

                        if (newKidBytes.Length != 16)
                            throw new InvalidOperationException(
                                $"Mapped KID '{keyMap[keyIndex]}' is not 16 bytes!");

                        // Write new KID
                        ms.Seek(kidPos, SeekOrigin.Begin);
                        ms.Write(newKidBytes);

                        searchIndex = kidOffset + 1;
                    }

                    ms.Seek(blockStart + bytesRead, SeekOrigin.Begin);
                }

                ms.Seek(0, SeekOrigin.Begin);
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[StreamingProxy][Dolby Atmos] Error fixing Atmos KID: {ex}");
                return inData;
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        }

    }
}

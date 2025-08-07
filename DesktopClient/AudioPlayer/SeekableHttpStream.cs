using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;

public class SeekableHttpStream : Stream
{
    private readonly HttpClient _httpClient;
    private readonly string _url;
    private readonly long _length;

    private const int BufferSize = 50 * 1024 * 1024;  // 50MB buffer
    private const int DownloadChunkSize = 1024 * 1024; // 1MB per download

    private byte[] _buffer = new byte[BufferSize];
    private long _bufferStart = 0;
    private long _bufferEnd = 0;
    private long _position = 0;

    private readonly object _bufferLock = new object();

    private readonly ManualResetEventSlim _bufferReady = new ManualResetEventSlim(false);
    private readonly AutoResetEvent _seekSignal = new AutoResetEvent(false);
    private Thread _downloaderThread;
    private bool _stopRequested = false;

    public SeekableHttpStream(string url)
    {
        _url = url ?? throw new ArgumentNullException(nameof(url));
        _httpClient = new HttpClient();

        var headRequest = new HttpRequestMessage(HttpMethod.Head, _url);
        var headResponse = _httpClient.Send(headRequest);

        if (!headResponse.IsSuccessStatusCode)
            throw new IOException($"Failed to access URL: {_url} (Status: {headResponse.StatusCode})");

        if (!headResponse.Content.Headers.ContentLength.HasValue)
            throw new NotSupportedException("Server did not provide a Content-Length header.");

        _length = headResponse.Content.Headers.ContentLength.Value;

        if (!headResponse.Headers.AcceptRanges.Contains("bytes", StringComparer.OrdinalIgnoreCase))
            throw new NotSupportedException("Server does not support range requests.");

        StartDownloader();
    }

    private void StartDownloader()
    {
        _downloaderThread = new Thread(() =>
        {
            while (!_stopRequested)
            {
                long downloadFrom;

                lock (_bufferLock)
                {
                    downloadFrom = _position;
                    _bufferStart = downloadFrom;
                    _bufferEnd = downloadFrom;
                    _bufferReady.Reset();
                }

                long totalDownloaded = 0;

                while (!_stopRequested && totalDownloaded < BufferSize)
                {
                    long rangeStart = downloadFrom + totalDownloaded;
                    long rangeEnd = Math.Min(rangeStart + DownloadChunkSize - 1, _length - 1);
                    if (rangeEnd < rangeStart) break;

                    var request = new HttpRequestMessage(HttpMethod.Get, _url);
                    request.Headers.Range = new RangeHeaderValue(rangeStart, rangeEnd);

                    using var response = _httpClient.Send(request);
                    if (!response.IsSuccessStatusCode)
                        break;

                    using var responseStream = response.Content.ReadAsStream();
                    int chunkSize = (int)(rangeEnd - rangeStart + 1);
                    int bufferOffset = (int)(rangeStart - downloadFrom);

                    int read = 0;
                    while (read < chunkSize)
                    {
                        int r = responseStream.Read(_buffer, bufferOffset + read, chunkSize - read);
                        if (r == 0) break;
                        read += r;
                    }

                    lock (_bufferLock)
                    {
                        _bufferStart = downloadFrom;
                        _bufferEnd = rangeStart + read;
                        _bufferReady.Set();
                    }

                    totalDownloaded += read;

                    if (rangeEnd >= _length - 1)
                        break;
                }

                _seekSignal.WaitOne(); // Wait until next seek or shutdown
            }
        });

        _downloaderThread.IsBackground = true;
        _downloaderThread.Start();
    }

    public override int Read(byte[] buffer, int offset, int count)
    {
        if (buffer == null)
            throw new ArgumentNullException(nameof(buffer));
        if (offset < 0 || count < 0 || offset + count > buffer.Length)
            throw new ArgumentOutOfRangeException();

        int bytesRead = 0;

        while (bytesRead < count)
        {
            int toCopy = 0;

            lock (_bufferLock)
            {
                if (_position >= _length)
                    break;

                if (_position >= _bufferStart && _position < _bufferEnd)
                {
                    long bufferOffset = _position - _bufferStart;
                    toCopy = (int)Math.Min(count - bytesRead, _bufferEnd - _position);
                    Array.Copy(_buffer, bufferOffset, buffer, offset + bytesRead, toCopy);
                    _position += toCopy;
                    bytesRead += toCopy;
                    continue;
                }

                // If data is not in buffer, request it via downloader
                _bufferReady.Reset();
                _seekSignal.Set(); // Notify downloader
            }

            _bufferReady.Wait(); // Wait until downloader fills buffer
        }

        return bytesRead;
    }

    public override long Seek(long offset, SeekOrigin origin)
    {
        lock (_bufferLock)
        {
            long newPos = origin switch
            {
                SeekOrigin.Begin => offset,
                SeekOrigin.Current => _position + offset,
                SeekOrigin.End => _length + offset,
                _ => throw new ArgumentOutOfRangeException(nameof(origin), "Invalid SeekOrigin")
            };

            if (newPos < 0 || newPos > _length)
                throw new IOException("Invalid seek position.");

            _position = newPos;
        }

        _seekSignal.Set(); // Wake downloader to fetch new range
        return Position;
    }

    public override bool CanRead => true;
    public override bool CanSeek => true;
    public override bool CanWrite => false;

    public override long Length => _length;

    public override long Position
    {
        get
        {
            lock (_bufferLock)
            {
                return _position;
            }
        }
        set => Seek(value, SeekOrigin.Begin);
    }

    public override void Flush() { }

    public override void SetLength(long value) =>
        throw new NotSupportedException("SetLength is not supported.");

    public override void Write(byte[] buffer, int offset, int count) =>
        throw new NotSupportedException("Write is not supported.");

    protected override void Dispose(bool disposing)
    {
        _stopRequested = true;
        _seekSignal.Set(); // Wake the downloader
        _downloaderThread?.Join();
        _httpClient.Dispose();
        base.Dispose(disposing);
    }
}

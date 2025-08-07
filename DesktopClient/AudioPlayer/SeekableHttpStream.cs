using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;

public class SeekableHttpStream : Stream
{
    private readonly HttpClient _httpClient;
    private readonly string _url;

    private long _length;
    private long _position = 0;

    private readonly object _lock = new object();

    private bool _isSeekableStreaming;
    private bool _fullyLoaded;

    // Streaming mode
    private const int BufferSize = 5 * 1024 * 1024;
    private const int DownloadChunkSize = 256 * 1024;
    private byte[] _buffer = new byte[BufferSize];
    private long _bufferStart = 0;
    private long _bufferEnd = 0;
    private ManualResetEventSlim _bufferReady = new ManualResetEventSlim(false);
    private AutoResetEvent _seekSignal = new AutoResetEvent(false);
    private Thread _downloaderThread;
    private bool _stopRequested = false;

    // Fully-loaded mode
    private byte[] _fullData;

    public SeekableHttpStream(string url)
    {
        _url = url ?? throw new ArgumentNullException(nameof(url));
        _httpClient = new HttpClient();

        try
        {
            var headRequest = new HttpRequestMessage(HttpMethod.Head, _url);
            var headResponse = _httpClient.Send(headRequest);

            if (!headResponse.IsSuccessStatusCode)
                throw new IOException($"HEAD request failed: {headResponse.StatusCode}");

            bool hasLength = headResponse.Content.Headers.ContentLength.HasValue;
            bool hasRange = headResponse.Headers.AcceptRanges.Contains("bytes", StringComparer.OrdinalIgnoreCase);

            if (hasLength && hasRange)
            {
                _length = headResponse.Content.Headers.ContentLength.Value;
                _isSeekableStreaming = true;
                StartDownloader();
            }
            else
            {
                // Fall back to full download
                LoadEntireFile();
            }
        }
        catch
        {
            // If HEAD fails, try to GET full file
            LoadEntireFile();
        }
    }

    private void LoadEntireFile()
    {
        var response = _httpClient.GetAsync(_url, HttpCompletionOption.ResponseHeadersRead).Result;
        if (!response.IsSuccessStatusCode)
            throw new IOException($"Failed to download file: {response.StatusCode}");

        using var stream = response.Content.ReadAsStream();
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        _fullData = ms.ToArray();
        _length = _fullData.Length;
        _fullyLoaded = true;
    }

    private void StartDownloader()
    {
        _downloaderThread = new Thread(() =>
        {
            while (!_stopRequested)
            {
                long downloadFrom;

                lock (_lock)
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
                    if (!response.IsSuccessStatusCode) break;

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

                    lock (_lock)
                    {
                        _bufferStart = downloadFrom;
                        _bufferEnd = rangeStart + read;
                        _bufferReady.Set();
                    }

                    totalDownloaded += read;

                    if (rangeEnd >= _length - 1)
                        break;
                }

                _seekSignal.WaitOne();
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

            lock (_lock)
            {
                if (_position >= _length)
                    break;

                if (_fullyLoaded)
                {
                    toCopy = (int)Math.Min(count - bytesRead, _length - _position);
                    Array.Copy(_fullData, _position, buffer, offset + bytesRead, toCopy);
                    _position += toCopy;
                    bytesRead += toCopy;
                    break;
                }
                else if (_position >= _bufferStart && _position < _bufferEnd)
                {
                    long bufferOffset = _position - _bufferStart;
                    toCopy = (int)Math.Min(count - bytesRead, _bufferEnd - _position);
                    Array.Copy(_buffer, bufferOffset, buffer, offset + bytesRead, toCopy);
                    _position += toCopy;
                    bytesRead += toCopy;
                    continue;
                }

                _bufferReady.Reset();
                _seekSignal.Set();
            }

            _bufferReady.Wait();
        }

        return bytesRead;
    }

    public override long Seek(long offset, SeekOrigin origin)
    {
        lock (_lock)
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

        if (!_fullyLoaded)
            _seekSignal.Set();

        return Position;
    }

    public override bool CanRead => true;
    public override bool CanSeek => true;
    public override bool CanWrite => false;

    public override long Length => _length;

    public override long Position
    {
        get { lock (_lock) { return _position; } }
        set => Seek(value, SeekOrigin.Begin);
    }

    public override void Flush() { }

    public override void SetLength(long value) =>
        throw new NotSupportedException();

    public override void Write(byte[] buffer, int offset, int count) =>
        throw new NotSupportedException();

    protected override void Dispose(bool disposing)
    {
        _stopRequested = true;
        _seekSignal.Set();
        _downloaderThread?.Join();
        _httpClient.Dispose();
        base.Dispose(disposing);
    }
}

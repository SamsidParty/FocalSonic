"""
Per-process WASAPI loopback capture (Windows Process Loopback API).

This captures the audio rendered by a *specific process and its child process
tree* — used to capture only the audio FocalSonic.exe (and its WebView2
children) produces, rather than the whole system mix.

Why not pyaudiowpatch / default-device loopback (as in GUIDANCE.md)?
  - The default-output loopback captures *everything* the user hears, including
    other apps. We only want FocalSonic's audio.
  - FocalSonic intentionally drops its output gain to ~1e-6 during AirPlay so the
    PC speakers stay silent. We capture that near-silent signal in 32-bit float
    (which preserves it losslessly) and scale it back up before streaming.

The capture format is therefore **32-bit IEEE float** — int16 would quantize a
1e-6 signal to zero. Float32 keeps full relative precision through the
scale-down / scale-up round trip.

Requires Windows 10 build 19041+ (the AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK
activation type). Implemented with raw COM via comtypes + ctypes because no pip
package wraps the process-loopback activation path.
"""

from __future__ import annotations

import ctypes
import logging
import threading
from ctypes import POINTER, byref, c_uint32, c_void_p, cast as c_cast
from ctypes.wintypes import DWORD, HANDLE, LPCWSTR

import comtypes
from comtypes import GUID, COMMETHOD, HRESULT, IUnknown

log = logging.getLogger("focalsonic.airplay.capture")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# The magic device-interface path for the process-loopback virtual device.
VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK = "VAD\\Process_Loopback"

AUDCLNT_SHAREMODE_SHARED = 0
AUDCLNT_STREAMFLAGS_LOOPBACK = 0x00020000
AUDCLNT_STREAMFLAGS_EVENTCALLBACK = 0x00040000
AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM = 0x80000000

AUDCLNT_BUFFERFLAGS_SILENT = 0x2

AUDIOCLIENT_ACTIVATION_TYPE_DEFAULT = 0
AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK = 1

PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE = 0
PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE = 1

WAVE_FORMAT_IEEE_FLOAT = 0x0003

VT_BLOB = 65

WAIT_OBJECT_0 = 0x0
WAIT_TIMEOUT = 0x102

CLSCTX_ALL = 0x17

# REFERENCE_TIME is in 100-ns units. Request a 200 ms ring buffer.
REFTIMES_PER_MILLISEC = 10000
BUFFER_DURATION_MS = 200


# ---------------------------------------------------------------------------
# Structures
# ---------------------------------------------------------------------------

class WAVEFORMATEX(ctypes.Structure):
    _fields_ = [
        ("wFormatTag", ctypes.c_ushort),
        ("nChannels", ctypes.c_ushort),
        ("nSamplesPerSec", ctypes.c_uint32),
        ("nAvgBytesPerSec", ctypes.c_uint32),
        ("nBlockAlign", ctypes.c_ushort),
        ("wBitsPerSample", ctypes.c_ushort),
        ("cbSize", ctypes.c_ushort),
    ]


class AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS(ctypes.Structure):
    _fields_ = [
        ("TargetProcessId", DWORD),
        ("ProcessLoopbackMode", ctypes.c_int),
    ]


class _ACTIVATION_UNION(ctypes.Union):
    _fields_ = [("ProcessLoopbackParams", AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS)]


class AUDIOCLIENT_ACTIVATION_PARAMS(ctypes.Structure):
    _anonymous_ = ("u",)
    _fields_ = [
        ("ActivationType", ctypes.c_int),
        ("u", _ACTIVATION_UNION),
    ]


class _BLOB(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_ulong), ("pBlobData", c_void_p)]


class _PROPVARIANT_UNION(ctypes.Union):
    _fields_ = [("blob", _BLOB), ("pad", ctypes.c_byte * 16)]


class PROPVARIANT(ctypes.Structure):
    _fields_ = [
        ("vt", ctypes.c_ushort),
        ("wReserved1", ctypes.c_ushort),
        ("wReserved2", ctypes.c_ushort),
        ("wReserved3", ctypes.c_ushort),
        ("u", _PROPVARIANT_UNION),
    ]


# ---------------------------------------------------------------------------
# COM interfaces (manually declared — WASAPI has no usable type library)
# ---------------------------------------------------------------------------

class IActivateAudioInterfaceAsyncOperation(IUnknown):
    _iid_ = GUID("{72A22D78-CDE4-431D-B8CC-843A71199B6D}")
    _methods_ = [
        COMMETHOD([], HRESULT, "GetActivateResult",
                  # c_long (not HRESULT) so comtypes returns the value instead of
                  # treating it as the call's own success HRESULT.
                  (["out"], POINTER(ctypes.c_long), "activateResult"),
                  (["out"], POINTER(POINTER(IUnknown)), "activatedInterface")),
    ]


class IActivateAudioInterfaceCompletionHandler(IUnknown):
    _iid_ = GUID("{41D949AB-9862-444A-80F6-C261334DA5EB}")
    _methods_ = [
        COMMETHOD([], HRESULT, "ActivateCompleted",
                  (["in"], POINTER(IActivateAudioInterfaceAsyncOperation), "activateOperation")),
    ]


class IAgileObject(IUnknown):
    # Marker interface (no methods beyond IUnknown). ActivateAudioInterfaceAsync
    # completes on its own MTA thread, so it QIs the handler for IAgileObject to
    # confirm it can be used cross-apartment. Without this the call is rejected
    # synchronously with E_ILLEGAL_METHOD_CALL (0x8000000E).
    _iid_ = GUID("{94EA2B94-E9CC-49E0-C0FF-EE64CA8F5B90}")
    _methods_ = []


class IAudioCaptureClient(IUnknown):
    _iid_ = GUID("{C8ADBD64-E71E-48A0-A4DE-185C395CD317}")
    _methods_ = [
        COMMETHOD([], HRESULT, "GetBuffer",
                  (["out"], POINTER(POINTER(ctypes.c_byte)), "ppData"),
                  (["out"], POINTER(c_uint32), "pNumFramesToRead"),
                  (["out"], POINTER(DWORD), "pdwFlags"),
                  (["out"], POINTER(ctypes.c_uint64), "pu64DevicePosition"),
                  (["out"], POINTER(ctypes.c_uint64), "pu64QPCPosition")),
        COMMETHOD([], HRESULT, "ReleaseBuffer",
                  (["in"], c_uint32, "NumFramesRead")),
        COMMETHOD([], HRESULT, "GetNextPacketSize",
                  (["out"], POINTER(c_uint32), "pNumFramesInNextPacket")),
    ]


class IAudioClient(IUnknown):
    _iid_ = GUID("{1CB9AD4C-DBFA-4C32-B178-C2F568A703B2}")
    _methods_ = [
        COMMETHOD([], HRESULT, "Initialize",
                  (["in"], ctypes.c_int, "ShareMode"),
                  (["in"], DWORD, "StreamFlags"),
                  (["in"], ctypes.c_longlong, "hnsBufferDuration"),
                  (["in"], ctypes.c_longlong, "hnsPeriodicity"),
                  (["in"], POINTER(WAVEFORMATEX), "pFormat"),
                  (["in"], POINTER(GUID), "AudioSessionGuid")),
        COMMETHOD([], HRESULT, "GetBufferSize",
                  (["out"], POINTER(c_uint32), "pNumBufferFrames")),
        COMMETHOD([], HRESULT, "GetStreamLatency",
                  (["out"], POINTER(ctypes.c_longlong), "phnsLatency")),
        COMMETHOD([], HRESULT, "GetCurrentPadding",
                  (["out"], POINTER(c_uint32), "pNumPaddingFrames")),
        COMMETHOD([], HRESULT, "IsFormatSupported",
                  (["in"], ctypes.c_int, "ShareMode"),
                  (["in"], POINTER(WAVEFORMATEX), "pFormat"),
                  (["out"], POINTER(POINTER(WAVEFORMATEX)), "ppClosestMatch")),
        COMMETHOD([], HRESULT, "GetMixFormat",
                  (["out"], POINTER(POINTER(WAVEFORMATEX)), "ppDeviceFormat")),
        COMMETHOD([], HRESULT, "GetDevicePeriod",
                  (["out"], POINTER(ctypes.c_longlong), "phnsDefaultDevicePeriod"),
                  (["out"], POINTER(ctypes.c_longlong), "phnsMinimumDevicePeriod")),
        COMMETHOD([], HRESULT, "Start"),
        COMMETHOD([], HRESULT, "Stop"),
        COMMETHOD([], HRESULT, "Reset"),
        COMMETHOD([], HRESULT, "SetEventHandle",
                  (["in"], HANDLE, "eventHandle")),
        COMMETHOD([], HRESULT, "GetService",
                  (["in"], POINTER(GUID), "riid"),
                  (["out"], POINTER(POINTER(IUnknown)), "ppv")),
    ]


# ---------------------------------------------------------------------------
# Completion handler implementation
# ---------------------------------------------------------------------------

class _CompletionHandler(comtypes.COMObject):
    """Receives the async activation callback and unblocks the caller."""

    _com_interfaces_ = [IActivateAudioInterfaceCompletionHandler, IAgileObject]

    def __init__(self):
        super().__init__()
        self.event = threading.Event()

    def ActivateCompleted(self, this, activateOperation):  # noqa: N802 (COM name)
        self.event.set()
        return 0  # S_OK


# ActivateAudioInterfaceAsync lives in mmdevapi.dll.
_mmdevapi = ctypes.windll.mmdevapi
_ActivateAudioInterfaceAsync = _mmdevapi.ActivateAudioInterfaceAsync
_ActivateAudioInterfaceAsync.restype = HRESULT
_ActivateAudioInterfaceAsync.argtypes = [
    LPCWSTR,            # deviceInterfacePath
    POINTER(GUID),      # riid
    POINTER(PROPVARIANT),  # activationParams
    c_void_p,           # completionHandler (IActivateAudioInterfaceCompletionHandler*)
    POINTER(POINTER(IActivateAudioInterfaceAsyncOperation)),  # activationOperation
]

_kernel32 = ctypes.windll.kernel32
_CreateEventW = _kernel32.CreateEventW
_CreateEventW.restype = HANDLE
_CreateEventW.argtypes = [c_void_p, ctypes.c_bool, ctypes.c_bool, LPCWSTR]
_WaitForSingleObject = _kernel32.WaitForSingleObject
_WaitForSingleObject.restype = DWORD
_WaitForSingleObject.argtypes = [HANDLE, DWORD]
_CloseHandle = _kernel32.CloseHandle
_CloseHandle.argtypes = [HANDLE]


# ---------------------------------------------------------------------------
# Public capture class
# ---------------------------------------------------------------------------

class ProcessLoopbackCapture:
    """
    Captures float32 audio from a process tree.

    Usage:
        cap = ProcessLoopbackCapture(pid, sample_rate=48000, channels=2)
        cap.start(on_chunk)   # on_chunk(bytes) called with float32-LE interleaved frames
        ...
        cap.stop()

    `include_tree=True` captures the target process *and all its descendants*
    (so a host exe + its WebView2 children are all captured from the host PID).
    """

    def __init__(self, pid: int, sample_rate: int = 48000, channels: int = 2,
                 include_tree: bool = True):
        self.pid = int(pid)
        self.sample_rate = int(sample_rate)
        self.channels = int(channels)
        self.include_tree = include_tree
        self.bytes_per_frame = channels * 4  # float32

        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._on_chunk = None
        self._started = threading.Event()
        self._start_error: Exception | None = None

    # -- lifecycle ---------------------------------------------------------

    def start(self, on_chunk):
        """Begin capturing. Blocks until the audio client is initialised."""
        self._on_chunk = on_chunk
        self._stop.clear()
        self._started.clear()
        self._start_error = None
        self._thread = threading.Thread(target=self._run, name="airplay-capture", daemon=True)
        self._thread.start()
        self._started.wait(timeout=15)
        if self._start_error is not None:
            raise self._start_error
        if not self._started.is_set():
            raise RuntimeError("Process loopback capture failed to start within 15s")

    def stop(self):
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5)
            self._thread = None

    # -- worker ------------------------------------------------------------

    def _activate_audio_client(self) -> IAudioClient:
        params = AUDIOCLIENT_ACTIVATION_PARAMS()
        params.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK
        params.ProcessLoopbackParams.TargetProcessId = self.pid
        params.ProcessLoopbackParams.ProcessLoopbackMode = (
            PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE
            if self.include_tree
            else PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE
        )

        prop = PROPVARIANT()
        prop.vt = VT_BLOB
        prop.u.blob.cbSize = ctypes.sizeof(AUDIOCLIENT_ACTIVATION_PARAMS)
        prop.u.blob.pBlobData = c_cast(byref(params), c_void_p)

        handler = _CompletionHandler()
        async_op = POINTER(IActivateAudioInterfaceAsyncOperation)()

        # The completion handler is passed as a raw IUnknown pointer. Keep the QI'd
        # pointer referenced for the duration of the call (it AddRefs internally).
        handler_ptr = handler.QueryInterface(IActivateAudioInterfaceCompletionHandler)

        hr = _ActivateAudioInterfaceAsync(
            VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK,
            byref(IAudioClient._iid_),
            byref(prop),
            c_cast(handler_ptr, c_void_p),
            byref(async_op),
        )
        if hr != 0:
            raise OSError(f"ActivateAudioInterfaceAsync failed: 0x{hr & 0xFFFFFFFF:08X}")

        if not handler.event.wait(timeout=10):
            raise TimeoutError("Process loopback activation timed out")

        # comtypes auto-returns the [out] params as a tuple.
        activate_result, activated = async_op.GetActivateResult()
        if activate_result != 0:
            raise OSError(
                f"GetActivateResult failed: 0x{activate_result & 0xFFFFFFFF:08X} "
                f"(is PID {self.pid} producing audio? is this Windows 10 19041+?)"
            )

        return activated.QueryInterface(IAudioClient)

    def _build_format(self) -> WAVEFORMATEX:
        fmt = WAVEFORMATEX()
        fmt.wFormatTag = WAVE_FORMAT_IEEE_FLOAT
        fmt.nChannels = self.channels
        fmt.nSamplesPerSec = self.sample_rate
        fmt.wBitsPerSample = 32
        fmt.nBlockAlign = self.channels * 4
        fmt.nAvgBytesPerSec = self.sample_rate * fmt.nBlockAlign
        fmt.cbSize = 0
        return fmt

    def _run(self):
        comtypes.CoInitializeEx(comtypes.COINIT_MULTITHREADED)
        hEvent = None
        audio_client = None
        try:
            audio_client = self._activate_audio_client()
            fmt = self._build_format()

            # Process loopback requires AUTOCONVERTPCM so the engine resamples the
            # per-process render formats into our requested float format.
            stream_flags = (
                AUDCLNT_STREAMFLAGS_LOOPBACK
                | AUDCLNT_STREAMFLAGS_EVENTCALLBACK
                | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM
            )
            audio_client.Initialize(
                AUDCLNT_SHAREMODE_SHARED,
                stream_flags,
                BUFFER_DURATION_MS * REFTIMES_PER_MILLISEC,
                0,
                byref(fmt),
                None,
            )

            hEvent = _CreateEventW(None, False, False, None)
            if not hEvent:
                raise OSError("CreateEvent failed")
            audio_client.SetEventHandle(hEvent)

            unknown = audio_client.GetService(byref(IAudioCaptureClient._iid_))
            capture_client = unknown.QueryInterface(IAudioCaptureClient)

            audio_client.Start()
            log.info(
                "Process loopback capture started (pid=%s, %s Hz, %s ch, float32)",
                self.pid, self.sample_rate, self.channels,
            )
            self._started.set()

            self._capture_loop(capture_client, hEvent)

        except Exception as exc:  # noqa: BLE001 - report to start()
            self._start_error = exc
            self._started.set()
            log.exception("Process loopback capture failed")
        finally:
            try:
                if audio_client is not None:
                    audio_client.Stop()
            except Exception:
                pass
            if hEvent:
                _CloseHandle(hEvent)
            comtypes.CoUninitialize()

    def _capture_loop(self, capture_client: IAudioCaptureClient, hEvent):
        timeout_ms = 100
        # One timeout window of silence keeps the downstream stream real-time when
        # the target process is briefly silent (event-driven loopback does not
        # fire events during silence).
        silence_frames = self.sample_rate * timeout_ms // 1000
        silence_chunk = b"\x00" * (silence_frames * self.bytes_per_frame)

        while not self._stop.is_set():
            wait = _WaitForSingleObject(hEvent, timeout_ms)

            got_data = False
            packet = capture_client.GetNextPacketSize()
            while packet != 0 and not self._stop.is_set():
                p_data, num_frames, flags, _dev_pos, _qpc = capture_client.GetBuffer()
                num_bytes = num_frames * self.bytes_per_frame

                if flags & AUDCLNT_BUFFERFLAGS_SILENT or not p_data:
                    data = b"\x00" * num_bytes
                else:
                    data = ctypes.string_at(p_data, num_bytes)

                capture_client.ReleaseBuffer(num_frames)
                if num_frames:
                    got_data = True
                    self._emit(data)
                packet = capture_client.GetNextPacketSize()

            if wait == WAIT_TIMEOUT and not got_data:
                # Target was silent for the whole window — emit matching silence
                # so AirPlay timing stays anchored to real time.
                self._emit(silence_chunk)

    def _emit(self, data: bytes):
        cb = self._on_chunk
        if cb is not None and data:
            cb(data)

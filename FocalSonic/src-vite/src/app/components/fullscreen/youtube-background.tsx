/*

Video background component using YouTube IFrame API
   - Video is visually a full-cover absolute background
   - Video playback is linked to the provided `audio` by polling (since you can’t attach events)

*/

import { usePlayerRef } from "@/store/player.store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoBackgroundProps } from "./video-background";

declare global {
    interface Window {
        YT?: any;
        onYouTubeIframeAPIReady?: () => void;
    }
}

function extractYouTubeVideoId(inputUrl: string): string | null {
    try {
        const url = new URL(inputUrl.trim());

        // youtu.be/<id>
        if (url.hostname === "youtu.be") {
            const id = url.pathname.split("/").filter(Boolean)[0];
            return id || null;
        }

        // youtube.com/watch?v=<id>
        const v = url.searchParams.get("v");
        if (v) return v;

        // youtube.com/shorts/<id>
        const shortsMatch = url.pathname.match(/\/shorts\/([^/?#]+)/);
        if (shortsMatch?.[1]) return shortsMatch[1];

        // youtube.com/embed/<id>
        const embedMatch = url.pathname.match(/\/embed\/([^/?#]+)/);
        if (embedMatch?.[1]) return embedMatch[1];

        return null;
    } catch {
    // Not a valid URL
        return null;
    }
}

let ytApiLoadPromise: Promise<void> | null = null;

function loadYouTubeIFrameApiOnce(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();

    // Already available
    if (window.YT?.Player) return Promise.resolve();

    // Already loading
    if (ytApiLoadPromise) return ytApiLoadPromise;

    ytApiLoadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[src="https://www.youtube.com/iframe_api"]'
        );
        if (existing) {
            // If script exists but YT isn't ready yet, wait for callback.
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                prev?.();
                resolve();
            };
            return;
        }

        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;

        script.onerror = () => reject(new Error("Failed to load YouTube IFrame API"));

        // The API calls this global when ready
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve();
        };

        document.head.appendChild(script);
    });

    return ytApiLoadPromise;
}

/**
 * <YouTubeBackground/>
 * - Uses YouTube IFrame Player API
 * - Video is visually a full-cover absolute background
 * - Video playback is slaved to the provided `audio` by polling (since you can’t attach events)
 */
export default function YouTubeBackground({
    videoUrl,
    audio,
    syncThresholdSeconds = 0.25,
    hardSeekThresholdSeconds = 0.6,
    muted = true,
    className = "",
    allowVideoWhenAudioPaused = false,
}: VideoBackgroundProps) {
    const videoId = useMemo(() => extractYouTubeVideoId(videoUrl), [videoUrl]);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const playerHostRef = useRef<HTMLDivElement | null>(null);

    const audioPlayerRef = usePlayerRef();

    if (!audio) {
        audio = audioPlayerRef;
    }

    const playerRef = useRef<any>(null);

    const rafRef = useRef<number | null>(null);
    const pollTimerRef = useRef<number | null>(null);

    const [ready, setReady] = useState(false);
    const [embedError, setEmbedError] = useState<string | null>(null);
    const [videoAspect, setVideoAspect] = useState<number>(16 / 9);
    const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    
    // Fade/Buffer states
    const [isBuffering, setIsBuffering] = useState(false);
    const [isLoopFading, setIsLoopFading] = useState(false);

    // Keep latest audio snapshot (polled) for sync loop without re-render spam
    const audioSnapshotRef = useRef<{ t: number; paused: boolean; playbackRate: number }>({
        t: 0,
        paused: true,
        playbackRate: 1,
    });
    const qualityCheckRef = useRef<number>(0);

    // Buffering detection refs
    const lastAudioPosRef = useRef<number>(0);
    const lastAudioMoveTimeRef = useRef<number>(0);

    // 1) Poll native audio state at a balanced interval
    //    100ms is responsive enough without being a battery murderer.
    useEffect(() => {
        if (!audio) return;

        const POLL_MS = 100;

        const tick = () => {
            const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            const paused = !!audio.paused;
            const playbackRate = Number.isFinite(audio.playbackRate) && audio.playbackRate > 0 ? audio.playbackRate : 1;

            audioSnapshotRef.current = { t, paused, playbackRate };

            // Buffering Logic
            const now = performance.now();
            if (paused) {
                setIsBuffering(false);
                lastAudioMoveTimeRef.current = now;
            } else {
                // If position hasn't changed much
                if (Math.abs(t - lastAudioPosRef.current) < 0.05) {
                    // If stuck for > 200ms, mark buffering
                    if (now - lastAudioMoveTimeRef.current > 200) {
                        setIsBuffering(true);
                    }
                } else {
                    setIsBuffering(false);
                    lastAudioMoveTimeRef.current = now;
                }
            }
            lastAudioPosRef.current = t;
        };

        tick();

        pollTimerRef.current = window.setInterval(tick, POLL_MS);

        return () => {
            if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        };
    }, [audio]);

    // 1.5) Fetch video aspect ratio via oEmbed (best-effort, no API key needed)
    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();

        async function fetchAspect() {
            try {
                const res = await fetch(
                    `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;
                const data = await res.json();
                const w = Number(data?.width);
                const h = Number(data?.height);
                if (!cancelled && Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                    setVideoAspect(w / h);
                }
            } catch {
                // ignore; keep default aspect
            }
        }

        if (videoUrl) fetchAspect();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [videoUrl]);

    // 1.6) Track container size for dynamic cover sizing
    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            setContainerSize({ w: width, h: height });
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // 2) Load YT API only when rendered, then build player
    useEffect(() => {
        let cancelled = false;

        async function setup() {
            setEmbedError(null);
            setReady(false);

            if (!videoId) {
                setEmbedError("Invalid YouTube URL (could not extract video id).");
                return;
            }

            // Load script only when this component mounts
            try {
                await loadYouTubeIFrameApiOnce();
            } catch (e: any) {
                if (!cancelled) setEmbedError(e?.message ?? "Failed to load YouTube API.");
                return;
            }

            if (cancelled) return;
            if (!playerHostRef.current) return;

            // Destroy previous player if any
            try {
                playerRef.current?.destroy?.();
            } catch {
                // ignore
            }
            playerRef.current = null;

            // Create a fresh host node (avoids weird iframe reuse issues)
            playerHostRef.current.innerHTML = "";
            const inner = document.createElement("div");
            inner.style.width = "100%";
            inner.style.height = "100%";
            playerHostRef.current.appendChild(inner);

            try {
                const p = new window.YT.Player(inner, {
                    width: "100%",
                    height: "100%",
                    videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        playsinline: 1,
                        fs: 0,
                        rel: 0,
                        modestbranding: 1,
                        disablekb: 1,
                        iv_load_policy: 3,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: () => {
                            if (cancelled) return;

                            playerRef.current = p;

                            try {
                                if (muted) p.mute();
                                else p.unMute();
                            } catch {}

                            try {
                                const levels = p.getAvailableQualityLevels?.() ?? [];
                                const preferred = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large"];
                                const pick = preferred.find((q) => levels.includes(q)) ?? levels[0];
                                if (pick) p.setPlaybackQuality?.(pick);
                            } catch {}

                            // Try to start playing (may be blocked by autoplay policy unless muted)
                            try {
                                p.playVideo();
                            } catch {}

                            setReady(true);
                        },
                        onError: (err: any) => {
                            // Common codes:
                            // 2 invalid ID
                            // 5 HTML5 error
                            // 100 not found
                            // 101/150 embedding disabled
                            const code = err?.data;
                            let msg = "YouTube video failed to play.";
                            if (code === 101 || code === 150) msg = "Embedding disabled for this video.";
                            if (code === 100) msg = "Video not found (removed or private).";
                            if (code === 2) msg = "Invalid YouTube video ID.";

                            setEmbedError(msg);
                        },
                    },
                });
            } catch (e: any) {
                setEmbedError(e?.message ?? "Failed to initialize YouTube player.");
            }
        }

        setup();

        return () => {
            cancelled = true;
            try {
                playerRef.current?.destroy?.();
            } catch {
                // ignore
            }
            playerRef.current = null;
        };
    }, [videoId, muted]);

    // 3) Sync loop (video follows audio)
    useEffect(() => {
        if (!ready) return;
        if (embedError) return;

        const player = playerRef.current;
        if (!player) return;

        // Local tracking to avoid setting state every frame
        let currentFadeState = false;

        const wrapTime = (t: number, duration: number) => {
            if (!Number.isFinite(t) || duration <= 0) return 0;
            const mod = t % duration;
            return mod < 0 ? mod + duration : mod;
        };

        const circularDelta = (target: number, current: number, duration: number) => {
            if (duration <= 0) return target - current;
            let delta = target - current;
            if (delta > duration / 2) delta -= duration;
            if (delta < -duration / 2) delta += duration;
            return delta;
        };

        const ensureState = () => {
            const { t: audioTime, paused: audioPaused, playbackRate } = audioSnapshotRef.current;

            // Define effective loop parameters
            const rawDuration = player.getDuration?.() ?? 0;
            // Kick in 1s earlier to avoid recommendations
            const effectiveDuration = Math.max(0, rawDuration - 1);

            // -- Fading Logic --
            if (effectiveDuration > 0) {
                const playhead = wrapTime(audioTime, effectiveDuration);
                const FADE_WINDOW = 1; // Fade out/in for 1s around the wrap
                const shouldFade = playhead < FADE_WINDOW || playhead > (effectiveDuration - FADE_WINDOW);
                
                if (shouldFade !== currentFadeState) {
                    currentFadeState = shouldFade;
                    setIsLoopFading(shouldFade);
                }
            }

            // If audio is paused, we generally want video paused too
            if (audioPaused && !allowVideoWhenAudioPaused) {
                try {
                    const st = player.getPlayerState?.();
                    // 1 = playing
                    if (st === 1) player.pauseVideo();
                } catch {}
                return;
            }

            // Keep player playback rate in sync with audio (pick closest available if possible)
            try {
                const desired = Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1;
                const rates: number[] = player.getAvailablePlaybackRates?.() ?? [];
                if (rates && rates.length > 0) {
                    let pick = rates[0];
                    pick = rates.reduce(
                        (prev: number, curr: number) =>
                            Math.abs(curr - desired) < Math.abs(prev - desired) ? curr : prev
                        , rates[0]
                    );
                    player.setPlaybackRate?.(pick);
                } else {
                    // best-effort: try to set desired directly
                    player.setPlaybackRate?.(desired);
                }
            } catch {}

            // Audio playing -> video should be playing
            try {
                const st = player.getPlayerState?.();
                // 2 = paused, 5 = video cued, -1 = unstarted
                if (st === 2 || st === 5 || st === -1) {
                    player.playVideo();
                }
                
                // Enforce early wrap (forbidden zone)
                const videoTime = player.getCurrentTime?.() ?? 0;
                // If we are past the effective end, force wrap immediately
                if (effectiveDuration > 0 && videoTime >= effectiveDuration) {
                    const target = wrapTime(audioTime, effectiveDuration);
                    player.seekTo(target, true);
                    player.playVideo();
                    return; // Skip drift check this frame
                }

                // Standard end check: 0 = ended
                if (st === 0) {
                    const target = wrapTime(audioTime, effectiveDuration);
                    player.seekTo(target, true);
                    player.playVideo();
                }
            } catch {}

            // Drift correction
            try {
                const target = wrapTime(audioTime, effectiveDuration);
                const videoTime = player.getCurrentTime?.() ?? 0;
                const drift = circularDelta(target, videoTime, effectiveDuration);

                // Big drift -> hard seek
                if (Math.abs(drift) >= hardSeekThresholdSeconds) {
                    player.seekTo(target, true);
                    return;
                }

                // Small-but-noticeable drift -> gentle seek
                if (Math.abs(drift) >= syncThresholdSeconds) {
                    player.seekTo(target, true);
                    return;
                }
            } catch {
                // ignore
            }

            // Opportunistically keep quality at highest available
            const now = performance.now();
            if (now - qualityCheckRef.current >= 4000) {
                qualityCheckRef.current = now;
                try {
                    const levels = player.getAvailableQualityLevels?.() ?? [];
                    const preferred = ["highres", "hd2160", "hd1440", "hd1080", "hd720", "large"];
                    const pick = preferred.find((q) => levels.includes(q)) ?? levels[0];
                    if (pick) player.setPlaybackQuality?.(pick);
                } catch {}
            }
        };

        const loop = () => {
            ensureState();
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [
        ready,
        embedError,
        syncThresholdSeconds,
        hardSeekThresholdSeconds,
        allowVideoWhenAudioPaused,
    ]);

    // Optional: keep player muted/unmuted in sync with prop changes
    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
            if (muted) player.mute();
            else player.unMute();
        } catch {}
    }, [muted]);

    const coverSize = useMemo(() => {
        const { w, h } = containerSize;
        if (w <= 0 || h <= 0) return { width: "100%", height: "100%" };
        const containerAspect = w / h;
        if (containerAspect >= videoAspect) {
            const height = w / videoAspect;
            return { width: `${w*1.1}px`, height: `${height*1.1}px` };
        }
        const width = h * videoAspect;
        return { width: `${width*1.1}px`, height: `${h*1.1}px` };
    }, [containerSize, videoAspect]);

    const shouldBlackout = !ready || isBuffering || isLoopFading;

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
            {/* Full-cover video layer */}
            <div className="absolute inset-0">
                {/* This wrapper lets us "cover" the parent with the YouTube iframe.
            YouTube iframes don't support object-fit directly, so we oversize and center. */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="absolute left-1/2 top-1/2"
                        style={{
                            transform: "translate(-50%, -50%)",
                            ...coverSize,
                            pointerEvents: "none", // ensures it's a true background
                        }}
                    >
                        <div ref={playerHostRef} className="w-full h-full" />
                    </div>
                </div>

                {/* Fade to black overlay */}
                <div
                    className={`absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none ${
                        shouldBlackout ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ zIndex: 10 }}
                />

                {/* Gradient overlay, dark at bottom and transparent at top */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent via-35% to-transparent pointer-events-none" style={{ zIndex: 20 }} />
            </div>

            {/* Error / fallback */}
            {embedError && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30 }}>
                    <div className="mx-4 max-w-md rounded-2xl bg-black/70 p-4 text-center text-white shadow-lg">
                        <div className="text-sm font-semibold">Video unavailable</div>
                        <div className="mt-1 text-xs opacity-80">{embedError}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

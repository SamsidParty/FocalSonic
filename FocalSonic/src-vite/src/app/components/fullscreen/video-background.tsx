import { useCustomFullscreenBackground, usePlayerRef } from "@/store/player.store";
import YouTubeBackground from "./youtube-background";

export default function VideoBackground({ videoUrl }: { videoUrl: string }) {
    const { videoBackgroundURL } = useCustomFullscreenBackground();

    // Check if videoBackgroundURL is a youtube link
    const isYouTubeLink = videoBackgroundURL.includes("youtube.com") || videoBackgroundURL.includes("youtu.be");

    if (isYouTubeLink) {        
        return <YouTubeBackground videoUrl={videoUrl} />;
    } else {
        return <RegularVideoBackground videoUrl={videoUrl} />;
    }
}

import React, { useEffect, useMemo, useRef } from "react";

export type VideoBackgroundAudioRef = {
    /** seconds */
    currentTime: number;
    /** true if audio is paused */
    paused: boolean;
};

export type VideoBackgroundProps = {
    /** Direct URL to an .mp4 (or other browser-supported video) */
    videoUrl: string;

    /** Your native-backed audio object (pollable) */
    audio: VideoBackgroundAudioRef;

    /** Start video muted (recommended). Default: true */
    muted?: boolean;

    /** Optional className for the container */
    className?: string;

    /** If true, video is allowed to play even while audio is paused. Default: false */
    allowVideoWhenAudioPaused?: boolean;

    /** Poll rate (ms) for checking audio time/paused. Default: 100 */
    audioPollMs?: number;

    /** Drift correction threshold (seconds). Default: 0.25 */
    syncThresholdSeconds?: number;

    /** If drift exceeds this, force a seek (seconds). Default: 0.6 */
    hardSeekThresholdSeconds?: number;
};

/**
 * <VideoBackground/>
 * - Plays a regular <video> as a full-cover absolute background
 * - Syncs playback position to your native audio clock by polling
 * - Wraps video time using modulo so it loops against longer audio
 */
export function RegularVideoBackground({
    videoUrl,
    audio,
    muted = true,
    className = "",
    allowVideoWhenAudioPaused = false,
    audioPollMs = 100,
    syncThresholdSeconds = 0.25,
    hardSeekThresholdSeconds = 0.6,
}: VideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const audioSnapshotRef = useRef<{ t: number; paused: boolean }>({
        t: 0,
        paused: true,
    });

    const videoMetaRef = useRef<{ duration: number; ready: boolean }>({
        duration: 0,
        ready: false,
    });

    const audioPlayerRef = usePlayerRef();

    if (!audio) {
        audio = audioPlayerRef;
    }

    // Keep these stable + safe
    const safeVideoUrl = useMemo(() => videoUrl?.trim() ?? "", [videoUrl]);

    // Poll native audio state
    useEffect(() => {
        if (!audio) return;

        const tick = () => {
            const t = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            const paused = !!audio.paused;
            audioSnapshotRef.current = { t, paused };
        };

        tick();
        const id = window.setInterval(tick, Math.max(50, audioPollMs));

        return () => window.clearInterval(id);
    }, [audio, audioPollMs]);

    // Track video metadata
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onLoadedMeta = () => {
            const d = Number.isFinite(v.duration) ? v.duration : 0;
            videoMetaRef.current = { duration: d, ready: d > 0 };
        };

        const onEmptied = () => {
            videoMetaRef.current = { duration: 0, ready: false };
        };

        v.addEventListener("loadedmetadata", onLoadedMeta);
        v.addEventListener("durationchange", onLoadedMeta);
        v.addEventListener("emptied", onEmptied);

        // If already loaded
        onLoadedMeta();

        return () => {
            v.removeEventListener("loadedmetadata", onLoadedMeta);
            v.removeEventListener("durationchange", onLoadedMeta);
            v.removeEventListener("emptied", onEmptied);
        };
    }, [safeVideoUrl]);

    // Sync loop (interval instead of RAF for performance sanity)
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const SYNC_MS = 120; // balanced: responsive without spamming seeks

        const sync = () => {
            const { t: audioTime, paused: audioPaused } = audioSnapshotRef.current;
            const { duration, ready } = videoMetaRef.current;

            if (!ready || duration <= 0) return;

            // Wrap video time to match audio timeline
            // (audioTime could be huge; modulo keeps it in [0, duration))
            const targetVideoTime = ((audioTime % duration) + duration) % duration;

            // If audio paused, we generally pause video too
            if (audioPaused && !allowVideoWhenAudioPaused) {
                if (!v.paused) {
                    v.pause();
                }
                // Still keep it positioned correctly (nice for scrubbing)
                const driftWhilePaused = Math.abs(v.currentTime - targetVideoTime);
                if (driftWhilePaused > syncThresholdSeconds) {
                    try {
                        v.currentTime = targetVideoTime;
                    } catch {}
                }
                return;
            }

            // Audio playing -> ensure video playing
            if (v.paused) {
                // Must be muted for autoplay on most browsers (we set muted by default)
                v.play().catch(() => {
                    // Autoplay might still be blocked; ignore
                });
            }

            // Drift correction
            const drift = targetVideoTime - v.currentTime;
            const abs = Math.abs(drift);

            if (abs >= hardSeekThresholdSeconds) {
                try {
                    v.currentTime = targetVideoTime;
                } catch {}
                return;
            }

            if (abs >= syncThresholdSeconds) {
                try {
                    v.currentTime = targetVideoTime;
                } catch {}
                return;
            }
        };

        const id = window.setInterval(sync, SYNC_MS);
        sync();

        return () => window.clearInterval(id);
    }, [allowVideoWhenAudioPaused, syncThresholdSeconds, hardSeekThresholdSeconds]);

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            {/* Full-cover video background */}
            <div className="absolute inset-0">
                <video
                    ref={videoRef}
                    src={safeVideoUrl}
                    muted={muted}
                    playsInline
                    preload="metadata"
                    controls={false}
                    // We DON'T rely on loop because we’re syncing by timestamp modulo
                    // loop
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                        pointerEvents: "none",
                    }}
                />

                {/* Optional overlay for readability */}
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
            </div>
        </div>
    );
}

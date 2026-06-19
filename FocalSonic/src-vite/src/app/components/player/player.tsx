import { getSongStreamUrl } from "@/api/httpClient";
import { MiniPlayerButton } from "@/app/components/mini-player/button";
import { RadioInfo } from "@/app/components/player/radio-info";
import { TrackInfo } from "@/app/components/player/track-info";
import {
    getVolume,
    usePlayerActions,
    usePlayerFilterData,
    usePlayerIsPlaying,
    usePlayerLoop,
    usePlayerMediaType,
    usePlayerRef,
    usePlayerSonglist,
    usePlayerSpeed,
    useReplayGainState,
} from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import { LoopState } from "@/types/playerContext";
import { hasPiPSupport, isFullscreen } from "@/utils/browser";
import { ReplayGainParams } from "@/utils/replayGain";
import { checkServerType } from "@/utils/servers";
import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";
import { useCastStatus } from "../header/cast";
import { AudioPlayer } from "./audio";
import { PlayerClearQueueButton } from "./clear-queue-button";
import { PlayerControls } from "./controls";
import { PlayerEffects } from "./effects";
import { PlayerLikeButton } from "./like-button";
import { PlayerLyricsButton } from "./lyrics-button";
import { PlayerProgress } from "./progress";
import { PlayerQueueButton } from "./queue-button";
import { PlayerVolume } from "./volume";

export function Player() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const radioRef = useRef<HTMLAudioElement>(null);
    const {
        setAudioPlayerRef,
        setCurrentDuration,
        setProgress,
        setPlayingState,
        handleSongEnded,
        getCurrentProgress,
    } = usePlayerActions();
    const { currentList, currentSongIndex, radioList } = usePlayerSonglist();
    const isPlaying = usePlayerIsPlaying();
    const { isSong, isRadio } = usePlayerMediaType();
    const { isAppleMusic } = checkServerType();
    const loopState = usePlayerLoop();
    const audioPlayerRef = usePlayerRef();
    const { replayGainType, replayGainPreAmp, replayGainDefaultGain } =
        useReplayGainState();
    const { speed } = usePlayerSpeed();
    const { filterData } = usePlayerFilterData();
    const { castStatus, castDeviceType } = useCastStatus();
    // Only hide local controls for remote (Chromecast) playback; AirPlay captures
    // local audio so effects/speed/volume still apply.
    const isRemoteCast = !!castStatus && castDeviceType === "chromecast";

    const song = currentList[currentSongIndex];
    const radio = radioList[currentSongIndex];
    const { playerStyle, isPlayerAtTop, isMiniPlayer } = usePlayerStyle();

    const getAudioRef = useCallback(() => {
        if (isRadio) return radioRef;

        return audioRef;
    }, [isRadio]);

    useEffect(() => {
        if (!isSong && !song) return;

        if (audioPlayerRef === null && audioRef.current) {
            setAudioPlayerRef(audioRef.current);
        }
    }, [audioPlayerRef, isSong, setAudioPlayerRef, song]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = speed;
        audioRef.current.preservesPitch = false;
    }, [speed]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (audioRef.current.filterData !== undefined) {
            audioRef.current.filterData = filterData;
        }
    }, [filterData]);

    const setupDuration = useCallback(() => {
        const audio = getAudioRef().current;
        if (!audio) return;

        const audioDuration = Math.floor(audio.duration);
        if (audioDuration !== Infinity) {
            setCurrentDuration(audioDuration);
        }

        const progress = getCurrentProgress();
        if (progress > 0) {
            setProgress(progress);
            audio.currentTime = progress;
        }
    }, [getAudioRef, getCurrentProgress, setCurrentDuration, setProgress]);

    const setupProgress = useCallback(() => {
        const audio = getAudioRef().current;
        if (!audio) return;

        setProgress(Math.floor(audio.currentTime));
    }, [getAudioRef, setProgress]);

    const setupInitialVolume = useCallback(() => {
        const audio = getAudioRef().current;
        if (!audio) return;

        audio.volume = getVolume() / 100;
    }, [getAudioRef]);

    function getTrackReplayGain(): ReplayGainParams {
        const preAmp = replayGainPreAmp;
        const defaultGain = replayGainDefaultGain;

        if (!song || !song.replayGain) {
            return { gain: defaultGain, peak: 1, preAmp };
        }

        if (replayGainType === "album") {
            const { albumGain = defaultGain, albumPeak = 1 } = song.replayGain;
            return { gain: albumGain, peak: albumPeak, preAmp };
        }

        const { trackGain = defaultGain, trackPeak = 1 } = song.replayGain;
        return { gain: trackGain, peak: trackPeak, preAmp };
    }

    return (
        <>
            {playerStyle === "floating" && (
                <div
                    className={clsx(
                        "fixed left-0 right-0 -z-10 h-[--player-height] bg-bar",
                        isPlayerAtTop ? "top-header" : "bottom-0",
                    )}
                />
            )}

            <footer
                className={clsx(
                    "fixed z-40 flex items-center",
                    playerStyle === "floating" && "[--player-height:64px] bottom-0 left-[--sidebar-width] right-[--sidebar-width] mb-8 ml-5 mr-7 mt-8 h-[64px] rounded-full bg-secondary shadow-lg",
                    playerStyle !== "floating" && "left-0 right-0 h-[--player-height] w-full bg-bar",
                    isPlayerAtTop ? "top-header" : "bottom-0",
                    (isFullscreen() || isMiniPlayer) && "player-idle-hide",
                )}
            >
                <div
                    className={clsx(
                        "grid h-full w-full grid-cols-player gap-2 px-3 xxs:flex xxs:flex-col xxs:justify-center",
                        playerStyle !== "floating" && "[grid-template-areas:'trackinfo_controls_extrabuttons']",
                        playerStyle === "floating" && "[grid-template-areas:'controls_trackinfo_extrabuttons']",
                    )}
                >
                    <div
                        className={clsx(
                            "flex items-center gap-2 [grid-area:trackinfo] xxs:hidden",
                            playerStyle === "floating" && "overflow-hidden",
                            playerStyle !== "floating" && "w-full",
                        )}
                    >
                        {isSong && <TrackInfo song={song} />}
                        {isRadio && <RadioInfo radio={radio} />}
                    </div>

                    <div
                        className={clsx(
                            playerStyle === "default" && "col-span-2 flex w-full flex-col items-center justify-center gap-1 px-4 xxs:w-full",
                            playerStyle === "floating" && "col-span-2 flex w-full flex-row items-center justify-center gap-1 xxs:w-full xxs:px-0",
                            playerStyle === "slim" && "col-span-2 flex w-full flex-row items-center justify-center gap-1 px-4 xxs:w-full xxs:px-0",
                            "[grid-area:controls]",
                        )}
                    >
                        <PlayerControls song={song} radio={radio} />

                        {isSong && <PlayerProgress audioRef={getAudioRef()} />}
                    </div>

                    <div className="flex w-full items-center justify-end [grid-area:extrabuttons] xxs:hidden">
                        <div className="flex items-center gap-1">
                            {isSong && (
                                <>
                                    <PlayerLikeButton disabled={!song} />
                                    <PlayerLyricsButton disabled={!song} />
                                    <PlayerQueueButton disabled={!song} />
                                </>
                            )}

                            {isRadio && <PlayerClearQueueButton disabled={!radio} />}

                            {isAppleMusic && !isRemoteCast && (
                                <PlayerEffects
                                    audioRef={getAudioRef()}
                                    disabled={!song && !radio}
                                />
                            )}

                            {!isRemoteCast && (
                                <PlayerVolume
                                    audioRef={getAudioRef()}
                                    disabled={!song && !radio}
                                />
                            )}

                            {isSong && hasPiPSupport && <MiniPlayerButton />}
                        </div>
                    </div>
                </div>

                {isSong && song && (
                    <AudioPlayer
                        replayGain={getTrackReplayGain()}
                        src={getSongStreamUrl(song.playbackId || song.id, song.contentType)}
                        autoPlay={isPlaying}
                        audioRef={audioRef}
                        loop={loopState === LoopState.One}
                        onPlay={() => setPlayingState(true)}
                        onPause={() => setPlayingState(false)}
                        onLoadedMetadata={setupDuration}
                        onTimeUpdate={setupProgress}
                        onEnded={handleSongEnded}
                        onLoadStart={setupInitialVolume}
                        data-testid="player-song-audio"
                    />
                )}

                {isRadio && radio && (
                    <AudioPlayer
                        src={radio.streamUrl}
                        autoPlay={isPlaying}
                        audioRef={radioRef}
                        onPlay={() => setPlayingState(true)}
                        onPause={() => setPlayingState(false)}
                        onLoadStart={setupInitialVolume}
                        data-testid="player-radio-audio"
                    />
                )}
            </footer>
        </>
    );
}

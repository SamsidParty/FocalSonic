import { useAudioContext } from "@/app/hooks/use-audio-context";
import {
    usePlayerActions,
    usePlayerIsPlaying,
    usePlayerMediaType,
    useReplayGainActions,
    useReplayGainState
} from "@/store/player.store";
import { logger } from "@/utils/logger";
import { isLinux } from "@/utils/osType";
import { ReplayGainParams } from "@/utils/replayGain";
import {
    ComponentPropsWithoutRef,
    RefObject,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { NativeAudioPlayer } from "./native-audio";

export type AudioPlayerProps = ComponentPropsWithoutRef<"audio"> & {
    audioRef: RefObject<HTMLAudioElement>
    replayGain?: ReplayGainParams
}

export function AudioPlayer({
    audioRef,
    replayGain,
    ...props
}: AudioPlayerProps) {
    const { t } = useTranslation();
    const [previousGain, setPreviousGain] = useState(1);
    const { replayGainEnabled, replayGainError } = useReplayGainState();
    const { isSong, isRadio } = usePlayerMediaType();
    const { setPlayingState } = usePlayerActions();
    const { setReplayGainEnabled, setReplayGainError } = useReplayGainActions();
    const useNativeAudio = window.igniteView;
    const isPlaying = usePlayerIsPlaying();


    const { resumeContext } = useAudioContext(audioRef.current);


    const handleSongError = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        logger.error("Audio load error", {
            src: audio.src,
            networkState: audio.networkState,
            readyState: audio.readyState,
            error: audio.error,
        });

        toast.error(t("warnings.songError"));

        if (replayGainEnabled || !replayGainError) {
            setReplayGainEnabled(false);
            setReplayGainError(true);
            window.location.reload();
        }
    }, [
        audioRef,
        replayGainEnabled,
        replayGainError,
        setReplayGainEnabled,
        setReplayGainError,
        t,
    ]);

    const handleRadioError = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        toast.error(t("radios.error"));
        setPlayingState(false);
    }, [audioRef, setPlayingState, t]);

    useEffect(() => {
        async function handleSong() {
            const audio = audioRef.current;
            if (!audio) return;

            try {
                if (isPlaying) {
                    if (isSong) await resumeContext();
                    await audio.play();
                } else {
                    audio.pause();
                }
            } catch (error) {
                logger.error("Audio playback failed", error);
                handleSongError();
            }
        }
        if (isSong) handleSong();
    }, [audioRef, handleSongError, isPlaying, isSong, resumeContext]);

    useEffect(() => {
        async function handleRadio() {
            const audio = audioRef.current;
            if (!audio) return;

            if (isPlaying) {
                audio.load();
                await audio.play();
            } else {
                audio.pause();
            }
        }
        if (isRadio) handleRadio();
    }, [audioRef, isPlaying, isRadio]);

    const handleError = useMemo(() => {
        if (isSong) return handleSongError;
        if (isRadio) return handleRadioError;

        return undefined;
    }, [handleRadioError, handleSongError, isRadio, isSong]);

    const crossOrigin = useMemo(() => {
        if (isLinux || !isSong || replayGainError) return undefined;

        return "anonymous";
    }, [isSong, replayGainError]);

    if (useNativeAudio) {
        return (
            <NativeAudioPlayer
                audioRef={audioRef}
                onError={handleError}
                {...props}
            />
        );
    }

    return (
        <audio
            ref={audioRef}
            {...props}
            crossOrigin={crossOrigin}
            onError={handleError}
        />
    );
}

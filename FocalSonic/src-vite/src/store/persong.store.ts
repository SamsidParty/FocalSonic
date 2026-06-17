import { IPersongContext, IPersongInterface } from "@/types/persongContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayerCurrentSong } from "./player.store";

const PERSONG_OVERRIDES_EVENT = "persongOverridesChanged";

async function savePersongData(songID: string, data: IPersongContext) {
    // Saves per-song data

    if (window.igniteView?.commandBridge?.saveCustomOverride) {
        await window.igniteView?.commandBridge?.saveCustomOverride("PersongOverrides", songID, JSON.stringify(data));

        try {
            window.dispatchEvent(new CustomEvent(PERSONG_OVERRIDES_EVENT, { detail: { songID } }));
        } catch (e) {
            // ignore dispatch errors
        }
    }
}

async function loadPersongData(songID: string): Promise<IPersongContext | null> {
    // Loads per-song data
    
    if (window.igniteView?.commandBridge?.getCustomOverride && songID) {
        const data = await window.igniteView?.commandBridge?.getCustomOverride("PersongOverrides", songID);
        if (data) return JSON.parse(data) as IPersongContext;
    }

    return null;
}

function getDefaultPersongData(songID: string): IPersongContext {
    return {
        id: songID,
        customBackgroundType: undefined,
        videoBackgroundURL: undefined,
    };
}

function isDefaultPersongData(songID: string, data: IPersongContext): boolean {
    const def = getDefaultPersongData(songID);
    return (
        data.customBackgroundType === def.customBackgroundType &&
    data.videoBackgroundURL === def.videoBackgroundURL
    );
}

export function usePersongOverrides(): {
    data: IPersongContext;
    isLoaded: boolean;
    isLoading: boolean;
} & IPersongInterface {
    const { id: songID } = usePlayerCurrentSong();
    const [data, setData] = useState<IPersongContext>(() => getDefaultPersongData(songID));
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // used to prevent stale async updates when song changes quickly
    const loadTokenRef = useRef(0);

    useEffect(() => {
        let alive = true;
        const token = ++loadTokenRef.current;

        // reset immediately when song changes (so UI doesn't show wrong song's data)
        setData(getDefaultPersongData(songID));
        setIsLoaded(false);

        setIsLoading(true);
        void (async () => {
            try {
                const loaded = await loadPersongData(songID);

                if (!alive) return;
                if (token !== loadTokenRef.current) return;

                setData(loaded ?? getDefaultPersongData(songID));
                setIsLoaded(true);
            } catch (e) {
                console.error("[usePersong] load failed:", e);
                if (!alive) return;
                if (token !== loadTokenRef.current) return;

                setData(getDefaultPersongData(songID));
                setIsLoaded(true);
            } finally {
                if (!alive) return;
                if (token !== loadTokenRef.current) return;

                setIsLoading(false);
            }
        })();

        const onOverridesChanged = (ev: Event) => {
            const ce = ev as CustomEvent<{ songID: string }>;
            if (!ce?.detail?.songID) return;
            if (ce.detail.songID !== songID) return;

            const myToken = loadTokenRef.current;
            void (async () => {
                try {
                    const loaded = await loadPersongData(songID);

                    if (!alive) return;
                    if (myToken !== loadTokenRef.current) return;

                    setData(loaded ?? getDefaultPersongData(songID));
                    setIsLoaded(true);
                } catch (err) {
                    // ignore reload errors
                }
            })();
        };

        window.addEventListener(PERSONG_OVERRIDES_EVENT, onOverridesChanged as EventListener);

        return () => {
            alive = false;
            window.removeEventListener(PERSONG_OVERRIDES_EVENT, onOverridesChanged as EventListener);
        };
    }, [songID]);

    const setVideoBackgroundURL = useCallback(
        (url: string) => {
            setData((prev) => {
                const next: IPersongContext = {
                    ...prev,
                    id: songID,
                    customBackgroundType: "video",
                    videoBackgroundURL: url,
                };

                // only save if not default
                if (!isDefaultPersongData(songID, next)) {
                    void savePersongData(songID, next);
                }

                return next;
            });
        },
        [songID]
    );

    const clearCustomBackground = useCallback(() => {
        setData((prev) => {
            const next: IPersongContext = {
                ...prev,
                id: songID,
                customBackgroundType: undefined,
                videoBackgroundURL: undefined,
            };

            void savePersongData(songID, next);

            return next;
        });
    }, [songID]);

    return useMemo(
        () => ({
            data,
            isLoaded,
            isLoading,
            setVideoBackgroundURL,
            clearCustomBackground,
        }),
        [data, isLoaded, isLoading, setVideoBackgroundURL, clearCustomBackground]
    );
}
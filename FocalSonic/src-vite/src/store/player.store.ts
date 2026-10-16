import { getCoverArtUrl, getSongStreamUrl } from "@/api/httpClient";
import { toggleFavorite } from "@/lib/sync/favorites";
import { getNextSong as getAppleMusicRadioNextSong } from "@/service/applemusic/radios";
import { service } from "@/service/service";
import { getSharedFilterData, getSharedSpeed, getSharedVolume, useSharedStore } from "@/store/shared.store";
import { AppleMusicStation, AppleMusicStationDisplay } from "@/types/applemusic/common";
import { IPlayerContext, LoopState } from "@/types/playerContext";
import { ISong } from "@/types/responses/song";
import { exitFullscreen, exitMiniPlayer } from "@/utils/browser";
import { areSongListsEqual } from "@/utils/compareSongLists";
import { checkServerType } from "@/utils/servers";
import { addNextSongList, moveArrayItem, shuffleSongList } from "@/utils/songListFunctions";
import { produce } from "immer";
import mergeWith from "lodash/mergeWith";
import omit from "lodash/omit";
import { createJSONStorage, devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { useAppSettings } from "./app.store";
import { usePersongOverrides } from "./persong.store";

const blurSettings = {
    min: 20,
    max: 100,
    step: 10,
};

let lastSongList: string | null = null;

// True once hydration from C# is done. Before that we drop empty writes (setItem).
let playerStoreHydrated = false;

// Set when getPlayerStore never answered. Hydration still completes, but with empty
// defaults rather than the real queue, so that state must not be written back.
let playerStoreHydrationFailed = false;
let hydrationRetryTimer: ReturnType<typeof setTimeout> | null = null;
let hydrationRetries = 0;

// Only an explicit clear may push an empty queue to C#.
let queueClearedIntentionally = false;

function scheduleHydrationRetry() {
    if (hydrationRetryTimer || hydrationRetries >= 10) { return; }

    const delay = Math.min(1000 * 2 ** hydrationRetries, 30000);
    hydrationRetries++;

    hydrationRetryTimer = setTimeout(() => {
        hydrationRetryTimer = null;
        void usePlayerStore.persist.rehydrate();
    }, delay);
}

function isAppleMusicStationDisplay(
    station: AppleMusicStation | AppleMusicStationDisplay | null | undefined,
): station is AppleMusicStationDisplay {
    return Boolean(station && "name" in station && !("attributes" in station));
}

function getNormalizedStation(
    station: AppleMusicStation | null | undefined,
    song?: ISong,
) {
    const songStationData = song?.appleMusic?.data?.relationships?.station?.data;
    const normalizedSongStation = Array.isArray(songStationData)
        ? songStationData[0]
        : songStationData;

    return station ?? normalizedSongStation;
}

function getAppleMusicStationDisplay(
    station?: AppleMusicStation | AppleMusicStationDisplay | null,
    song?: ISong,
): AppleMusicStationDisplay | null {
    const existingDisplay = isAppleMusicStationDisplay(station) ? station : null;
    const normalizedStation = getNormalizedStation(existingDisplay ? null : station as AppleMusicStation | null | undefined, song);
    const stationName = existingDisplay?.name ?? normalizedStation?.attributes?.name;

    if (!normalizedStation?.id && !stationName) {
        return null;
    }

    return {
        id: existingDisplay?.id ?? normalizedStation?.id ?? station?.id ?? "",
        name: stationName ?? "",
        coverArt: existingDisplay?.coverArt ?? normalizedStation?.attributes?.artwork?.url,
    };
}

function moveSongRelativeToNeighbors<T extends { id: string }>(
    list: T[],
    movedSongId: string,
    previousSongId?: string,
    nextSongId?: string,
) {
    const sourceIndex = list.findIndex((item) => item.id === movedSongId);

    if (sourceIndex === -1) {
        return [...list];
    }

    const nextList = [...list];
    const [movedItem] = nextList.splice(sourceIndex, 1);

    if (nextSongId) {
        const nextIndex = nextList.findIndex((item) => item.id === nextSongId);

        if (nextIndex !== -1) {
            nextList.splice(nextIndex, 0, movedItem);
            return nextList;
        }
    }

    if (previousSongId) {
        const previousIndex = nextList.findIndex((item) => item.id === previousSongId);

        if (previousIndex !== -1) {
            nextList.splice(previousIndex + 1, 0, movedItem);
            return nextList;
        }
    }

    nextList.push(movedItem);
    return nextList;
}

const igniteViewPlayerStore = {
    getItem: async (key: string) => {
        if (key !== "player_store") { return null; }
        console.log("[Player Bridge] Downstream sync triggered", key);

        // The bridge isn't always ready when hydration runs. Returning undefined
        // would make zustand JSON.parse(undefined) and abort hydration, so retry
        // and never return undefined (null = "nothing stored").
        // 20x50ms was too short: at boot the bridge shares a server with the library
        // sync and the proxies. Giving up hydrated empty defaults over a live queue.
        const deadline = Date.now() + 15000;

        for (let attempt = 0; Date.now() < deadline; attempt++) {
            try {
                const bridge = window.igniteView?.commandBridge;

                if (typeof bridge?.getPlayerStore === "function") {
                    const result = await bridge.getPlayerStore();

                    // Any non-empty string ("{}" included) is a valid answer.
                    if (typeof result === "string" && result.trim()) {
                        playerStoreHydrationFailed = false;
                        hydrationRetries = 0;
                        return result;
                    }
                }
            }
            catch (error) {
                console.warn("[Player Bridge] getPlayerStore failed, retrying", error);
            }

            await new Promise((resolve) => setTimeout(resolve, Math.min(50 * (attempt + 1), 500)));
        }

        // Couldn't read the queue - that is not the same as it being empty.
        playerStoreHydrationFailed = true;
        console.warn("[Player Bridge] getPlayerStore did not respond; keeping the C# queue");
        return null;
    },
    setItem: async (key: string, value: string) => {
        if (key !== "player_store") { return; }
        const nextValue = JSON.parse(value) as {
            extraProperties?: Record<string, string>
            state: {
                songlist?: Record<string, unknown>
            }
        };

        // An empty songlist only reaches C# when the queue was emptied on purpose.
        // Otherwise it is a set() racing hydration, or a hydration that failed - and
        // writing it replaces the real process-wide queue with nothing.
        const songlist = nextValue.state?.songlist as {
            currentList?: unknown[]
            radioList?: unknown[]
            currentSong?: { id?: string }
        } | undefined;

        const isEmptyDefault =
            (songlist?.currentList?.length ?? 0) === 0 &&
            (songlist?.radioList?.length ?? 0) === 0 &&
            !songlist?.currentSong?.id;

        if (isEmptyDefault && !queueClearedIntentionally) { return; }
        if (!isEmptyDefault) { queueClearedIntentionally = false; }

        // Insert extra properties to allow C# to have extra context
        const { isAppleMusic } = checkServerType();
        nextValue.extraProperties = {
            coverArtBaseURL: isAppleMusic ? "{id}" : getCoverArtUrl("{id}"),
            streamBaseURL: isAppleMusic ? "{id}" : getSongStreamUrl("{id}"),
        };

        const songListCompare = JSON.stringify(nextValue.state.songlist ?? {});

        if (songListCompare === lastSongList) {
            // Do a mini sync without the songlist to avoid large data transfers
            //console.log("[Player Bridge] Mini sync triggered");
            nextValue.state.songlist = {};
            await window.igniteView?.commandBridge.setPlayerStoreMini(JSON.stringify(nextValue));
        }
        else {
            // Do a full sync
            lastSongList = songListCompare;
            //console.log("[Player Bridge] Full sync triggered");
            await window.igniteView?.commandBridge.setPlayerStore(JSON.stringify(nextValue));
        }


    },
    removeItem: async (key: string) => {
        if (key !== "player_store") { return; }
        await window.igniteView?.commandBridge.setPlayerStore("{}");
    }
};


export const usePlayerStore = createWithEqualityFn<IPlayerContext>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set, get) => ({
                    isLoading: true,
                    songlist: {
                        shuffledList: [],
                        originalList: [],
                        originalSongIndex: 0,
                        currentSong: {} as ISong,
                        currentList: [],
                        currentSongIndex: 0,
                        radioList: [],
                        currentRadioID: null,
                        currentRadioStation: null,
                    },
                    playerState: {
                        isPlaying: false,
                        loopState: LoopState.Off,
                        isShuffleActive: false,
                        isSongStarred: false,
                        volume: getSharedVolume(),
                        speed: getSharedSpeed(),
                        filterData: getSharedFilterData(),
                        currentDuration: 0,
                        mediaType: "song",
                        audioPlayerRef: null,
                        mainDrawerState: false,
                        queueState: false,
                        lyricsState: false,
                        hasPrev: false,
                        hasNext: false,
                    },
                    playerProgress: {
                        progress: 0,
                    },
                    settings: {
                        volume: {
                            min: 0,
                            max: 100,
                            step: 1,
                            wheelStep: 5,
                        },
                        speed: {
                            min: 0.5,
                            max: 2,
                            step: 0.01,
                            wheelStep: 0.1,
                        },
                        replayGain: {
                            values: {
                                enabled: false,
                                type: "track",
                                preAmp: 0,
                                error: false,
                                defaultGain: -6,
                            },
                            actions: {
                                setReplayGainEnabled: (value) => {
                                    set((state) => {
                                        state.settings.replayGain.values.enabled = value;
                                    });
                                },
                                setReplayGainType: (value) => {
                                    set((state) => {
                                        state.settings.replayGain.values.type = value;
                                    });
                                },
                                setReplayGainPreAmp: (value) => {
                                    set((state) => {
                                        state.settings.replayGain.values.preAmp = value;
                                    });
                                },
                                setReplayGainError: (value) => {
                                    set((state) => {
                                        state.settings.replayGain.values.error = value;
                                    });
                                },
                                setReplayGainDefaultGain: (value) => {
                                    set((state) => {
                                        state.settings.replayGain.values.defaultGain = value;
                                    });
                                },
                            },
                        },
                        colors: {
                            currentSongColor: null,
                            bigPlayer: {
                                blur: {
                                    value: 40,
                                    settings: blurSettings,
                                },
                            },
                        },
                    },
                    presenceNonce: 0,
                    actions: {
                        setSongList: (songlist, index, shuffle = false) => {
                            const { currentList, currentSongIndex } = get().songlist;

                            const listsAreEqual = areSongListsEqual(currentList, songlist);
                            const songHasChanged = currentSongIndex !== index;

                            if (!listsAreEqual || (listsAreEqual && songHasChanged)) {
                                get().actions.resetProgress();
                            }

                            if (listsAreEqual && songHasChanged && !shuffle) {
                                set((state) => {
                                    state.playerState.isPlaying = true;
                                    state.songlist.currentSongIndex = index;
                                });
                                return;
                            }

                            set((state) => {
                                state.songlist.originalList = songlist;
                                state.songlist.originalSongIndex = index;
                                state.playerState.mediaType = "song";
                                state.songlist.radioList = [];
                                state.songlist.currentRadioID = null;
                                state.songlist.currentRadioStation = null;
                            });

                            if (shuffle) {
                                const shuffledList = shuffleSongList(songlist, index, true);

                                set((state) => {
                                    state.songlist.shuffledList = shuffledList;
                                    state.songlist.currentList = shuffledList;
                                    state.songlist.currentSongIndex = 0;
                                    state.playerState.isShuffleActive = true;
                                    state.playerState.isPlaying = true;
                                });
                            } else {
                                set((state) => {
                                    state.songlist.currentList = songlist;
                                    state.songlist.currentSongIndex = index;
                                    state.playerState.isShuffleActive = false;
                                    state.playerState.isPlaying = true;
                                });
                            }
                        },
                        setCurrentSong: () => {
                            const { currentList, currentSongIndex } = get().songlist;

                            if (currentList.length > 0) {
                                set((state) => {
                                    state.songlist.currentSong = currentList[currentSongIndex];

                                    if (state.songlist.currentRadioID) {
                                        const currentRadioStation = getAppleMusicStationDisplay(
                                            state.songlist.currentRadioStation,
                                            state.songlist.currentSong,
                                        );

                                        if (currentRadioStation) {
                                            state.songlist.currentRadioStation = currentRadioStation;
                                        }
                                    }
                                });
                            }
                        },
                        playSong: (song) => {
                            const { isPlaying } = get().playerState;
                            const songIsAlreadyPlaying = get().actions.checkActiveSong(
                                song.id,
                            );
                            if (songIsAlreadyPlaying && !isPlaying) {
                                set((state) => {
                                    state.playerState.isPlaying = true;
                                });
                            } else {
                                get().actions.resetProgress();
                                set((state) => {
                                    state.playerState.mediaType = "song";
                                    state.songlist.currentList = [song];
                                    state.songlist.currentSongIndex = 0;
                                    state.playerState.isShuffleActive = false;
                                    state.playerState.isPlaying = true;
                                    state.songlist.radioList = [];
                                    state.songlist.currentRadioID = null;
                                    state.songlist.currentRadioStation = null;
                                });
                            }
                        },
                        setNextOnQueue: (list) => {
                            const {
                                currentList,
                                currentSongIndex,
                                currentSong,
                                originalList,
                            } = get().songlist;


                            const currentListIds = new Set(currentList.map((song) => song.id));
                            const uniqueList = list;

                            const newCurrentList = addNextSongList(
                                currentSongIndex,
                                currentList,
                                uniqueList,
                            );

                            const indexOnOriginalList = originalList.findIndex(
                                (song) => song.id === currentSong.id,
                            );
                            const newOriginalList = addNextSongList(
                                indexOnOriginalList,
                                originalList,
                                uniqueList,
                            );

                            set((state) => {
                                state.songlist.currentList = newCurrentList;
                                state.songlist.originalList = newOriginalList;
                            });

                            const { isPlaying } = get().playerState;

                            if (!isPlaying) {
                                get().actions.setPlayingState(true);
                            }
                        },
                        setLastOnQueue: (list) => {
                            const { currentList, originalList } = get().songlist;

                            const currentListIds = new Set(currentList.map((song) => song.id));
                            const uniqueList = list;

                            const newCurrentList = [...currentList, ...uniqueList];
                            const newOriginalList = [...originalList, ...uniqueList];

                            set((state) => {
                                state.songlist.currentList = newCurrentList;
                                state.songlist.originalList = newOriginalList;
                            });

                            const { isPlaying } = get().playerState;

                            if (!isPlaying) {
                                get().actions.setPlayingState(true);
                            }
                        },
                        setPlayRadio: (list, index) => {
                            const { mediaType } = get().playerState;
                            const { radioList, currentSongIndex } = get().songlist;

                            if (
                                mediaType === "radio" &&
                radioList.length > 0 &&
                list[index].id === radioList[currentSongIndex].id
                            ) {
                                set((state) => {
                                    state.playerState.isPlaying = true;
                                });
                                return;
                            }

                            get().actions.clearPlayerState();
                            set((state) => {
                                state.playerState.mediaType = "radio";
                                state.songlist.radioList = list;
                                state.songlist.currentSongIndex = index;
                                state.playerState.isPlaying = true;
                                state.songlist.currentRadioStation = null;
                            });
                        },
                        setPlayAppleMusicRadio: async (station) => {
                            const firstSong = await getAppleMusicRadioNextSong(station.id);
                            const currentRadioStation = getAppleMusicStationDisplay(station, firstSong);

                            if (firstSong) {
                                get().actions.setSongList([firstSong], 0);
                                set((state) => {
                                    state.songlist.currentRadioID = station.id;
                                    state.songlist.currentRadioStation = currentRadioStation;
                                    state.playerState.loopState = LoopState.InfiniteRadio;
                                });
                            }
                        },
                        setPlayingState: (status) => {
                            set((state) => {
                                state.playerState.isPlaying = status;
                            });
                        },
                        togglePlayPause: () => {
                            set((state) => {
                                state.playerState.isPlaying = !state.playerState.isPlaying;
                            });
                        },
                        toggleLoop: () => {
                            const { loopState } = get().playerState;

                            // Cycles to the next state
                            let newState = LoopState.Off;

                            if (loopState === LoopState.Off) {
                                newState = LoopState.All;
                            } else if (loopState === LoopState.All) {
                                newState = LoopState.One;
                            } else if (loopState === LoopState.InfiniteRadio) {
                                newState = LoopState.Off;
                            }

                            set((state) => {
                                state.playerState.loopState = newState;
                            });
                        },
                        toggleShuffle: () => {
                            const { isShuffleActive } = get().playerState;
                            const { currentList, currentSong, originalList, originalSongIndex } = get().songlist;

                            const baseList = originalList.length > 0 ? originalList : currentList;
                            const resolvedOriginalSongIndex = currentSong.id
                                ? baseList.findIndex((song) => song.id === currentSong.id)
                                : originalSongIndex;

                            if (baseList.length <= 1 || resolvedOriginalSongIndex < 0) return;

                            if (isShuffleActive) {
                                set((state) => {
                                    state.songlist.currentList = baseList;
                                    state.songlist.currentSongIndex = resolvedOriginalSongIndex;
                                    state.songlist.originalSongIndex = resolvedOriginalSongIndex;
                                    state.playerState.isShuffleActive = false;
                                });
                            } else {
                                const earlierSongs = baseList.slice(0, resolvedOriginalSongIndex);
                                const songListToShuffle = baseList.slice(resolvedOriginalSongIndex);
                                const shuffledList = [
                                    ...earlierSongs,
                                    ...shuffleSongList(songListToShuffle, 0),
                                ];

                                set((state) => {
                                    state.songlist.shuffledList = shuffledList;
                                    state.songlist.currentList = shuffledList;
                                    state.songlist.currentSongIndex = resolvedOriginalSongIndex;
                                    state.songlist.originalSongIndex = resolvedOriginalSongIndex;
                                    state.playerState.isShuffleActive = true;
                                });
                            }
                        },
                        playNextSong: () => {

                            if (window.igniteView) {
                                window.igniteView.commandBridge.nextButtonPressed(); // Tell C# to do it instead
                                return;
                            }

                            const { loopState } = get().playerState;
                            const { hasNextSong, resetProgress, playFirstSongInQueue } =
                get().actions;

                            if (hasNextSong()) {
                                resetProgress();
                                set((state) => {
                                    state.songlist.currentSongIndex += 1;
                                });
                            } else if (loopState === LoopState.All) {
                                resetProgress();
                                playFirstSongInQueue();
                            }
                        },
                        playPrevSong: () => {

                            if (window.igniteView) {
                                window.igniteView.commandBridge.previousButtonPressed(); // Tell C# to do it instead
                                return;
                            }

                            const { currentSongIndex, currentList } = get().songlist;
                            const { loopState } = get().playerState;

                            if (currentSongIndex > 0) {
                                get().actions.resetProgress();
                                set((state) => {
                                    state.songlist.currentSongIndex -= 1;
                                });
                            } else if (loopState === LoopState.All && currentList.length > 0) {
                                get().actions.resetProgress();
                                set((state) => {
                                    state.songlist.currentSongIndex = currentList.length - 1;
                                });
                            }
                        },
                        clearPlayerState: () => {
                            queueClearedIntentionally = true;

                            set((state) => {
                                state.playerState?.audioPlayerRef && (state.playerState.audioPlayerRef.src = "");
                                state.playerState?.audioPlayerRef?.pause();
                                state.songlist.originalList = [];
                                state.songlist.shuffledList = [];
                                state.songlist.currentList = [];
                                state.songlist.currentSong = {} as ISong;
                                state.songlist.radioList = [];
                                state.songlist.currentRadioID = null;
                                state.songlist.currentRadioStation = null;
                                state.songlist.originalSongIndex = 0;
                                state.songlist.currentSongIndex = 0;
                                state.playerState.mediaType = "song";
                                state.playerState.isPlaying = false;
                                state.playerState.loopState = LoopState.Off;
                                state.playerState.isShuffleActive = false;
                                state.playerState.mainDrawerState = false;
                                state.playerState.currentDuration = 0;
                                state.settings.colors.currentSongColor = null;
                            });
                        },
                        disposePlayer: () => {
                            set((state) => {
                                const disposeFn = state.playerState?.audioPlayerRef?.dispose;
                                disposeFn && disposeFn(state.playerState?.audioPlayerRef as any); // Only native-audio will have the dispose function
                            });
                        },
                        resetProgress: () => {
                            set((state) => {
                                state.playerProgress.progress = 0;
                            });
                        },
                        setProgress: (progress) => {
                            set((state) => {
                                state.playerProgress.progress = progress;
                            });
                        },
                        setVolume: (volume) => {
                            useSharedStore.getState().actions.setVolume(volume);
                        },
                        setSpeed: (speed) => {
                            useSharedStore.getState().actions.setSpeed(speed);
                        },
                        setFilterData: (data) => {
                            useSharedStore.getState().actions.setFilterData(data);
                        },
                        handleVolumeWheel: (isScrollingDown) => {
                            useSharedStore.getState().actions.handleVolumeWheel(isScrollingDown);
                        },
                        setCurrentDuration: (duration) => {
                            set((state) => {
                                state.playerState.currentDuration = duration;
                            });
                        },
                        hasNextSong: () => {
                            const { mediaType, loopState } = get().playerState;
                            const { currentList, currentSongIndex, radioList } =
                get().songlist;

                            const nextIndex = currentSongIndex + 1;

                            if (mediaType === "song") {
                                return (nextIndex < currentList.length) || loopState === LoopState.All || loopState === LoopState.InfiniteRadio;
                            }
                            if (mediaType === "radio") {
                                return nextIndex < radioList.length;
                            }

                            return false;
                        },
                        hasPrevSong: () => {
                            const { currentSongIndex } = get().songlist;
                            const { loopState } = get().playerState;
                            return currentSongIndex > 0 || loopState === LoopState.All;
                        },
                        isPlayingOneSong: () => {
                            const { currentList } = get().songlist;
                            return currentList.length === 1;
                        },
                        checkActiveSong: (id: string) => {
                            const currentSong = get().songlist.currentSong;
                            if (currentSong) {
                                return id === currentSong.id;
                            } else {
                                return false;
                            }
                        },
                        checkIsSongStarred: () => {
                            const { currentList, currentSongIndex } = get().songlist;
                            const { mediaType } = get().playerState;
                            const song = currentList[currentSongIndex];


                            if (mediaType === "song" && song) {
                                const isStarred = typeof song.starred === "string";

                                set((state) => {
                                    state.playerState.isSongStarred = isStarred;
                                });
                            } else {
                                set((state) => {
                                    state.playerState.isSongStarred = false;
                                });
                            }
                        },
                        starSongInQueue: (id) => {
                            const { currentList } = get().songlist;
                            const { mediaType } = get().playerState;

                            if (currentList.length === 0 && mediaType !== "song") return;

                            const songIndex = currentList.findIndex((song) => song.id === id);
                            if (songIndex === -1) return;

                            const songList = [...currentList];
                            const isSongStarred =
                typeof songList[songIndex].starred === "string";

                            songList[songIndex] = {
                                ...songList[songIndex],
                                starred: isSongStarred ? undefined : new Date().toISOString(),
                            };

                            set((state) => {
                                state.songlist.currentList = songList;
                            });
                        },
                        starCurrentSong: async () => {
                            const { currentList, currentSongIndex } = get().songlist;
                            const { mediaType } = get().playerState;

                            if (currentList.length === 0 && mediaType !== "song") return;

                            const { id, starred } = get().songlist.currentSong;
                            const isSongStarred = typeof starred === "string";

                            // Optimistically update the queue (drives the heart via the
                            // currentList subscription), then sync local + server.
                            const songList = [...currentList];
                            songList[currentSongIndex] = {
                                ...songList[currentSongIndex],
                                starred: isSongStarred ? undefined : new Date().toISOString(),
                            };
                            set((state) => {
                                state.songlist.currentList = songList;
                            });

                            try {
                                await toggleFavorite("song", id, isSongStarred);
                            } catch {
                                const reverted = [...get().songlist.currentList];
                                reverted[currentSongIndex] = { ...reverted[currentSongIndex], starred };
                                set((state) => {
                                    state.songlist.currentList = reverted;
                                });
                            }
                        },
                        setAudioPlayerRef: (audioPlayer) => {
                            set(
                                produce((state: IPlayerContext) => {
                                    if (audioPlayer === null) { state.actions.disposePlayer(); }
                                    state.playerState.audioPlayerRef = audioPlayer;
                                }),
                            );
                        },
                        moveSongInQueue: (fromIndex, toIndex) => {
                            const {
                                currentList,
                                originalList,
                                shuffledList,
                                currentSongIndex,
                            } = get().songlist;
                            const { isShuffleActive } = get().playerState;

                            if (
                                fromIndex === toIndex ||
                                fromIndex < 0 ||
                                toIndex < 0 ||
                                fromIndex >= currentList.length ||
                                toIndex >= currentList.length
                            ) {
                                return;
                            }

                            const movedSongId = currentList[fromIndex]?.id;
                            const currentSongId = currentList[currentSongIndex]?.id;

                            if (!movedSongId) {
                                return;
                            }

                            const nextCurrentList = moveArrayItem(currentList, fromIndex, toIndex);
                            const movedSongIndex = nextCurrentList.findIndex((song) => song.id === movedSongId);
                            const previousSongId = nextCurrentList[movedSongIndex - 1]?.id;
                            const nextSongId = nextCurrentList[movedSongIndex + 1]?.id;

                            const nextOriginalList = isShuffleActive
                                ? moveSongRelativeToNeighbors(originalList, movedSongId, previousSongId, nextSongId)
                                : nextCurrentList;

                            const nextShuffledList = isShuffleActive
                                ? nextCurrentList
                                : shuffledList.length > 0
                                    ? moveSongRelativeToNeighbors(shuffledList, movedSongId, previousSongId, nextSongId)
                                    : [];

                            const nextCurrentSongIndex = currentSongId
                                ? Math.max(nextCurrentList.findIndex((song) => song.id === currentSongId), 0)
                                : 0;

                            const nextOriginalSongIndex = currentSongId
                                ? Math.max(nextOriginalList.findIndex((song) => song.id === currentSongId), 0)
                                : 0;

                            set((state) => {
                                state.songlist.currentList = nextCurrentList;
                                state.songlist.originalList = nextOriginalList;
                                state.songlist.shuffledList = nextShuffledList;
                                state.songlist.currentSongIndex = nextCurrentSongIndex;
                                state.songlist.originalSongIndex = nextOriginalSongIndex;
                            });
                        },
                        removeSongFromQueue: (id) => {
                            const {
                                currentList,
                                originalList,
                                shuffledList,
                                currentSongIndex,
                                originalSongIndex,
                            } = get().songlist;

                            // Get the removed song index to adjust the current one.
                            const removedSongIndex = currentList.findIndex(
                                (song) => song.id === id,
                            );
                            const newCurrentList = currentList.filter(
                                (song) => song.id !== id,
                            );

                            // Clear player state if list is empty
                            if (newCurrentList.length === 0) {
                                get().actions.clearPlayerState();
                                return;
                            }

                            // In case of removing current song, resets the progress
                            if (removedSongIndex === currentSongIndex) {
                                get().actions.resetProgress();
                            }

                            const newOriginalList = originalList.filter(
                                (song) => song.id !== id,
                            );
                            const newShuffledList = shuffledList.filter(
                                (song) => song.id !== id,
                            );

                            // Update index to fit new current list
                            const updatedCurrentIndex = Math.min(
                                currentSongIndex -
                  (removedSongIndex < currentSongIndex ? 1 : 0),
                                newCurrentList.length - 1,
                            );

                            // Update original index
                            const removedOriginalIndex = originalList.findIndex(
                                (song) => song.id === id,
                            );
                            const updatedOriginalIndex = Math.min(
                                originalSongIndex -
                  (removedOriginalIndex < originalSongIndex ? 1 : 0),
                                newOriginalList.length - 1,
                            );

                            set((state) => {
                                state.songlist.currentList = newCurrentList;
                                state.songlist.originalList = newOriginalList;
                                state.songlist.shuffledList = newShuffledList;
                                state.songlist.currentSongIndex = updatedCurrentIndex;
                                state.songlist.originalSongIndex = updatedOriginalIndex;
                            });
                        },
                        setMainDrawerState: (status) => {

                            if (!status) {
                                exitMiniPlayer();
                                exitFullscreen();
                            }

                            set((state) => {
                                state.playerState.mainDrawerState = status;
                            });
                        },
                        closeDrawer: () => {

                            exitMiniPlayer();
                            exitFullscreen();

                            set((state) => {
                                state.playerState.mainDrawerState = false;
                            });
                        },
                        playFirstSongInQueue: () => {
                            set((state) => {
                                state.songlist.currentSongIndex = 0;
                            });
                        },
                        handleSongEnded: () => {
                            
                            // C# side will do the queue resolution
                            if (window.igniteView) { return; }

                            const { loopState } = get().playerState;
                            const {
                                hasNextSong,
                                playNextSong,
                                setPlayingState,
                                clearPlayerState,
                            } = get().actions;

                            if (hasNextSong() || loopState === LoopState.All) {
                                playNextSong();
                                setPlayingState(true);
                            } else {
                                clearPlayerState();
                                setPlayingState(false);
                            }
                        },
                        getCurrentProgress: () => {
                            return get().playerProgress.progress;
                        },
                        updateQueueChecks: () => {
                            const { hasPrevSong, hasNextSong } = get().actions;

                            set((state) => {
                                state.playerState.hasPrev = hasPrevSong();
                                state.playerState.hasNext = hasNextSong();
                            });
                        },
                        resetConfig: () => {
                            set((state) => {
                                state.settings.colors.bigPlayer.blur.value = 40;
                                state.settings.colors.bigPlayer.blur.settings = blurSettings;
                                state.settings.replayGain.values = {
                                    enabled: false,
                                    type: "track",
                                    preAmp: 0,
                                    error: false,
                                    defaultGain: -6,
                                };
                            });
                        },
                        setCurrentSongColor: (value) => {
                            set((state) => {
                                state.settings.colors.currentSongColor = value;
                            });
                        },
                        setBigPlayerBlurValue: (value) => {
                            set((state) => {
                                state.settings.colors.bigPlayer.blur.value = value;
                            });
                        },
                        setIsLoading: (value) => {
                            set((state) => {
                                state.isLoading = value;
                            });
                        },
                        setPresenceNonce: (value) => {
                            set((state) => {
                                state.presenceNonce = value;
                            }); 
                        }
                    },
                    playerCallbackData: {},
                })),
                { name: "player_store" },
            ),
            {
                name: "player_store",
                version: 1,

                storage: createJSONStorage(() => !window.igniteView ? localStorage : igniteViewPlayerStore),

                merge: (persistedState, currentState) => {
                    // Merge into a fresh object — immer freezes the state, so
                    // mutating currentState directly would drop the persisted data.
                    // mergeWith: lodash merges arrays element-wise, so a queue restored
                    // after any pre-hydration write came back spliced from both lists.
                    const merged = mergeWith({}, currentState, persistedState, (_target, source) => {
                        if (Array.isArray(source)) { return source; }
                    }) as IPlayerContext;

                    // shared_store owns speed/filterData (it survives restarts), so
                    // never let a stale player_store payload override them.
                    merged.playerState.speed = getSharedSpeed();
                    merged.playerState.filterData = getSharedFilterData();

                    return merged;
                },
                onRehydrateStorage(state) {
                    return (_hydratedState, error) => {
                        // Empty defaults that didn't come from C#: don't let them stick.
                        if (error || playerStoreHydrationFailed) {
                            scheduleHydrationRetry();
                            state.actions.setIsLoading(false);
                            return;
                        }

                        playerStoreHydrated = true;
                        // Recalculate the current song incase the index changed
                        state.actions.setCurrentSong();
                        state.actions.setIsLoading(false);
                    };
                },
                partialize: (state) => {
                    const playerStore = omit(state, [
                        "actions",
                        "playerState.audioPlayerRef",
                    ]) as any;

                    delete playerStore.playerState.volume;
                    delete playerStore.playerState.speed;
                    delete playerStore.playerState.filterData;

                    return playerStore;
                },
            },
        ),
    ),
    shallow,
);

window.rehydratePlayerStore = async (newState: string) => {
    const current = usePlayerStore.getState();

    let parsed: { state?: Record<string, any> } | null = null;

    try { parsed = JSON.parse(newState); }
    catch { return; }

    // C# serializes with NullValueHandling.Ignore and answers "{}" before it has a
    // store, so state (or any slice) can be missing. Replacing ours with that leaves
    // songlist.currentList undefined and takes down everything reading its length.
    const stateToSet = parsed?.state;
    if (!stateToSet || typeof stateToSet !== "object") { return; }

    const incomingSonglist = stateToSet.songlist ?? {};

    // No queue in the payload means a mini-sync artefact, not "the queue is empty".
    const hasIncomingQueue =
        Array.isArray(incomingSonglist.currentList) ||
        Array.isArray(incomingSonglist.radioList);

    const mergedSonglist = hasIncomingQueue
        ? {
            ...current.songlist,
            ...incomingSonglist,
            currentRadioStation:
                incomingSonglist.currentRadioStation
                ?? current.songlist?.currentRadioStation
                ?? null,
        }
        : { ...current.songlist };

    const isLegacyPodcastState = stateToSet.playerState?.mediaType === "podcast";

    // Fresh object: current.songlist is frozen by immer.
    const songlist = isLegacyPodcastState
        ? {
            ...mergedSonglist,
            currentList: [],
            currentSong: {} as ISong,
            currentSongIndex: 0,
            originalList: [],
            shuffledList: [],
            radioList: [],
            currentRadioID: null,
            currentRadioStation: null,
        }
        : mergedSonglist;

    if (isLegacyPodcastState) {
        stateToSet.playerState.mediaType = "song";
        stateToSet.playerState.isPlaying = false;
        stateToSet.playerState.currentDuration = 0;
    }

    usePlayerStore.setState(
        {
            // Slices C# doesn't model must survive the replace.
            ...current,
            ...stateToSet,
            songlist,
            playerProgress: isLegacyPodcastState
                ? { ...current.playerProgress, ...stateToSet.playerProgress, progress: 0 }
                : { ...current.playerProgress, ...stateToSet.playerProgress },
            actions: current.actions,
            playerState: {
                ...current.playerState,
                ...stateToSet.playerState,
                // These live in shared_store now.
                volume: getSharedVolume(),
                speed: getSharedSpeed(),
                filterData: getSharedFilterData(),
                audioPlayerRef: current.playerState?.audioPlayerRef,
            },
        },
        true
    );
};

// Targeted update so an unrelated callback-data change can't replace player state.
window.rehydratePlayerCallbackData = async (newData: string) => {
    let parsed: Record<string, string> | null = null;

    try { parsed = JSON.parse(newData); }
    catch { return; }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) { return; }
    if (shallow(usePlayerStore.getState().playerCallbackData, parsed)) { return; }

    usePlayerStore.setState((state) => ({ ...state, playerCallbackData: parsed }));
};

usePlayerStore.subscribe(
    (state) => [state.songlist.currentList, state.songlist.currentSongIndex, state.songlist.originalList],
    () => {
        const playerStore = usePlayerStore.getState();
        const { mediaType } = playerStore.playerState;
        if (mediaType === "radio") return;

        playerStore.actions.checkIsSongStarred();
        playerStore.actions.setCurrentSong();

        const { currentList } = playerStore.songlist;
        const { progress } = playerStore.playerProgress;

        if (currentList.length === 0 && progress > 0) {
            playerStore.actions.resetProgress();
        }

        const { currentSong, originalList, originalSongIndex } = playerStore.songlist;

        if (currentSong.id && originalList.length > 0) {
            const nextOriginalSongIndex = originalList.findIndex(
                (song) => song.id === currentSong.id,
            );

            if (
                nextOriginalSongIndex >= 0 &&
                nextOriginalSongIndex !== originalSongIndex
            ) {
                usePlayerStore.setState((state) => ({
                    ...state,
                    songlist: {
                        ...state.songlist,
                        originalSongIndex: nextOriginalSongIndex,
                    },
                }));
            }
        }
    },
    {
        equalityFn: shallow,
    },
);

usePlayerStore.subscribe(
    ({ songlist, playerState }) => [
        songlist.currentList,
        songlist.radioList,
        songlist.currentSongIndex,
        playerState.loopState,
        playerState.mediaType,
    ],
    () => {
        usePlayerStore.getState().actions.updateQueueChecks();
    },
    {
        equalityFn: shallow,
    },
);

useSharedStore.subscribe(
    (state) => state.volume,
    (volume) => {
        if (usePlayerStore.getState().playerState.volume === volume) {
            return;
        }

        usePlayerStore.setState((state) => ({
            ...state,
            playerState: {
                ...state.playerState,
                volume,
            },
        }));
    },
);

useSharedStore.subscribe(
    (state) => ({ speed: state.speed, filterData: state.filterData }),
    ({ speed, filterData }) => {
        const { playerState } = usePlayerStore.getState();

        if (playerState.speed === speed && playerState.filterData === filterData) {
            return;
        }

        usePlayerStore.setState((state) => ({
            ...state,
            playerState: {
                ...state.playerState,
                speed,
                filterData,
            },
        }));
    },
    {
        equalityFn: shallow,
    },
);

/** Resolves when hydration finishes, or after timeoutMs if the bridge never answers. */
export function waitForPlayerStoreHydration(timeoutMs = 20000): Promise<void> {
    if (usePlayerStore.persist.hasHydrated()) { return Promise.resolve(); }

    return new Promise((resolve) => {
        let settled = false;

        function finish() {
            if (settled) { return; }
            settled = true;
            clearTimeout(timer);
            unsubscribe();
            resolve();
        }

        const timer = setTimeout(finish, timeoutMs);
        const unsubscribe = usePlayerStore.persist.onFinishHydration(finish);
    });
}

export const isPlaybackActive = () => usePlayerStore.getState().playerState.isPlaying;

export const usePlayerActions = () => usePlayerStore((state) => state.actions);
export const usePlayerCallbackData = (key: string) => usePlayerStore((state) => state.playerCallbackData[key] || undefined);

export const usePlayerSonglist = () =>
    usePlayerStore((state) => {
        const {
            currentList,
            currentSong,
            currentSongIndex,
            radioList,
        } = state.songlist;

        return {
            currentList,
            currentSong,
            currentSongIndex,
            radioList,
        };
    });

export const usePlayerCurrentSong = () =>
    usePlayerStore((state) => state.songlist.currentSong);

export const usePlayerCurrentSongIndex = () =>
    usePlayerStore((state) => state.songlist.currentSongIndex);

export const usePlayerProgress = () =>
    usePlayerStore((state) => state.playerProgress.progress);

export const usePlayerVolume = () => ({
    volume: useSharedStore((state) => state.volume),
    setVolume: useSharedStore((state) => state.actions.setVolume),
    handleVolumeWheel: useSharedStore((state) => state.actions.handleVolumeWheel),
});

export const usePlayerSpeed = () => ({
    speed: usePlayerStore((state) => state.playerState.speed),
    setSpeed: usePlayerStore((state) => state.actions.setSpeed)
});

export const usePlayerFilterData = () => ({
    filterData: usePlayerStore((state) => state.playerState.filterData),
    setFilterData: usePlayerStore((state) => state.actions.setFilterData)
});

export const useVolumeSettings = () =>
    usePlayerStore((state) => state.settings.volume);

export const useSpeedSettings = () =>
    usePlayerStore((state) => state.settings.speed);

export const useReplayGainState = () => {
    const { enabled, type, preAmp, error, defaultGain } = usePlayerStore(
        (state) => state.settings.replayGain.values,
    );

    return {
        replayGainEnabled: enabled,
        replayGainType: type,
        replayGainPreAmp: preAmp,
        replayGainError: error,
        replayGainDefaultGain: defaultGain,
    };
};

export const useReplayGainActions = () =>
    usePlayerStore((state) => state.settings.replayGain.actions);


export const usePlayerSettings = () => usePlayerStore((state) => state.settings);

export const usePlayerMediaType = () => {
    const mediaType = usePlayerStore((state) => state.playerState.mediaType);
    const isSong = mediaType === "song";
    const isRadio = mediaType === "radio";

    return {
        isSong,
        isRadio,
    };
};

export const usePlayerIsPlaying = () =>
    usePlayerStore((state) => state.playerState.isPlaying);

export const usePlayerDuration = () =>
    usePlayerStore((state) => state.playerState.currentDuration);

export const usePlayerSongStarred = () =>
    usePlayerStore((state) => state.playerState.isSongStarred);

export const usePlayerShuffle = () =>
    usePlayerStore((state) => state.playerState.isShuffleActive);

export const usePlayerLoop = () =>
    usePlayerStore((state) => state.playerState.loopState);

export const usePlayerPrevAndNext = () =>
    usePlayerStore((state) => ({
        hasPrev: state.playerState.hasPrev,
        hasNext: state.playerState.hasNext,
    }));

export const usePlayerRef = () =>
    usePlayerStore((state) => state.playerState.audioPlayerRef);

export const getVolume = () => getSharedVolume();

export const useMainDrawerState = () =>
    usePlayerStore((state) => ({
        mainDrawerState: state.playerState.mainDrawerState,
        setMainDrawerState: state.actions.setMainDrawerState,
        closeDrawer: state.actions.closeDrawer,
    }));

export const useQueueState = () => {
    const { extraBarContent, setExtraBarContent } = useAppSettings();

    return {
        queueState: extraBarContent === "queue",
        setQueueState: (state: boolean) => setExtraBarContent(state ? "queue" : "none"),
        toggleQueueAction: () => setExtraBarContent(extraBarContent === "queue" ? "none" : "queue"),
    };
};

export const useLyricsState = () => {
    const { extraBarContent, setExtraBarContent } = useAppSettings();

    return {
        lyricsState: extraBarContent === "lyrics",
        setLyricsState: (state: boolean) => setExtraBarContent(state ? "lyrics" : "none"),
        toggleLyricsAction: () => setExtraBarContent(extraBarContent === "lyrics" ? "none" : "lyrics"),
    };
};

export const useDynamicColors = () => {
    const { lyricBackgroundIntensity, setLyricBackgroundIntensity } = useAppSettings();
    const { currentSongColor } = usePlayerSettings().colors;

    const {
        setCurrentSongColor,
        setBigPlayerBlurValue,
    } = usePlayerActions();

    return {
        currentSongColor,
        setCurrentSongColor,
        currentSongColorIntensity: lyricBackgroundIntensity,
        setCurrentSongIntensity: setLyricBackgroundIntensity,
        useDynamicColorsOnQueue: lyricBackgroundIntensity > 1,
        useDynamicColorsOnBigPlayer: lyricBackgroundIntensity > 1,
        setuseDynamicColorsOnQueue: (v: boolean) =>  setLyricBackgroundIntensity(v ? 1.01 : 0.5),
        setuseDynamicColorsOnBigPlayer: (v: boolean) =>  setLyricBackgroundIntensity(v ? 1.01 : 0.5),
        bigPlayerBlur: 0,
        setBigPlayerBlurValue,
    };
};

export const useCustomFullscreenBackground = () => {

    const persongOverrides = usePersongOverrides();

    return {
        hideAlbumArt: !!persongOverrides.data.customBackgroundType,
        videoBackgroundURL: persongOverrides.data.videoBackgroundURL || null,
        customBackgroundType: persongOverrides.data.customBackgroundType,
    };
};

export const usePlayerCurrentList = () =>
    usePlayerStore((state) => state.songlist.currentList);

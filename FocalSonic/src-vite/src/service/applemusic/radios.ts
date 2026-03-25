import { httpClient } from "@/api/httpClient";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import { merge } from "lodash";
import { defaultAppleMusicQuery } from "./common";

export async function getNextSong(id: string) {
    const response = await httpClient<AppleMusicSong[]>(`/applemusic/me/stations/next-tracks/${id}`, {
        method: "POST",
        query: merge({
            limit: 1,
        }, defaultAppleMusicQuery)
    });
    return convertAppleMusicSongToSubsonic(response?.data[0]);
}

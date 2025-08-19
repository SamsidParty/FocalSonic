import { httpClient } from "@/api/httpClient";
import { AppleMusicSong, convertAppleMusicSongToSubsonic } from "@/types/applemusic/song";
import {
    CreateRadio,
    Radio
} from "@/types/responses/radios";
import { merge } from "lodash";
import { defaultAppleMusicQuery } from "./common";

async function getAll() {
    return [];
}

async function create({ name, streamUrl, homePageUrl }: CreateRadio) {

}

async function update({ id, streamUrl, name, homePageUrl = "" }: Radio) {

}

async function remove(id: string) {

}

async function getNextSong(id) {
    const response = await httpClient<AppleMusicSong[]>(`/applemusic/me/stations/next-tracks/${id}`, {
        method: "POST",
        query: merge({
            limit: 1,
        }, defaultAppleMusicQuery)
    });
    return convertAppleMusicSongToSubsonic(response?.data[0]);
}

export const radios = {
    getAll,
    create,
    update,
    remove,
    getNextSong
};

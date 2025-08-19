import { httpClient } from "@/api/httpClient";
import { AppleMusicRecommendationsResponse } from "@/types/applemusic/recommendations";

async function getHome() {

    const timezoneOffset = (() => {
        const offset = -new Date().getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
        const hours = pad(offset / 60);
        const minutes = pad(offset % 60);
        return `${sign}${hours}:${minutes}`;
    })();

    const response = await httpClient<AppleMusicRecommendationsResponse>("/applemusic/me/recommendations", {
        method: "GET",
        query: {
            "platform": "web",
            "displayFilter[kind]": "MusicCircleCoverShelf,MusicCoverGrid,MusicCoverShelf,MusicNotesHeroShelf,MusicSocialCardShelf,MusicSuperHeroShelf",
            "extend[playlists]": "artistNames",
            "extend[stations]": "airTime,supportsAirTimeUpdates",
            "fields[artists]": "name,artwork,url",
            "include[albums]": "artists",
            "include[personal-recommendation]": "primary-content",
            "meta[stations]": "inflectionPoints",
            "name": "listen-now",
            "omit[resource]": "autos",
            "timezone": timezoneOffset,
            "types": "activities,albums,apple-curators,artists,curators,editorial-items,library-albums,library-playlists,playlists,songs,stations,uploaded-audios,uploaded-videos",
            "with": "friendsMix,library,social"
        }
    });

    return response;
}

export const recommendations = {
    getHome
};
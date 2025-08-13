import { httpClient } from "@/api/httpClient";
import { IAppleMusicRecommendationsResponse } from "@/types/appleMusic/recommendations";

async function getHome() {
    // The URL is very long
    const response = await httpClient<IAppleMusicRecommendationsResponse>("/applemusic/me/recommendations?l=en-GB&platform=web&art%5Burl%5D=f&displayFilter%5Bkind%5D=MusicCircleCoverShelf%2CMusicCoverGrid%2CMusicCoverShelf%2CMusicNotesHeroShelf%2CMusicSocialCardShelf%2CMusicSuperHeroShelf&extend=editorialVideo%2CplainEditorialCard%2CplainEditorialNotes&extend%5Bplaylists%5D=artistNames&extend%5Bstations%5D=airTime%2CsupportsAirTimeUpdates&fields%5Bartists%5D=name%2Cartwork%2Curl&include%5Balbums%5D=artists&include%5Bpersonal-recommendation%5D=primary-content&meta%5Bstations%5D=inflectionPoints&name=listen-now&omit%5Bresource%5D=autos&timezone=%2B03%3A00&types=activities%2Calbums%2Capple-curators%2Cartists%2Ccurators%2Ceditorial-items%2Clibrary-albums%2Clibrary-playlists%2Cmusic-movies%2Cplaylists%2Csocial-profiles%2Csocial-upsells%2Csongs%2Cstations%2Ctv-shows%2Cuploaded-audios%2Cuploaded-videos&with=friendsMix%2Clibrary%2Csocial", {
        method: "GET"
    });

    return response;
}

export const recommendations = {
    getHome
};
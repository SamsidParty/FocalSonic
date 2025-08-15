import { httpClient } from "@/api/httpClient";
import { AppleMusicRecommendationsResponse } from "@/types/applemusic/recommendations";

async function getHome() {
    // The URL is very long
    const response = await httpClient<AppleMusicRecommendationsResponse>("/applemusic/me/recommendations", {
        method: "GET"
    });

    return response;
}

export const recommendations = {
    getHome
};
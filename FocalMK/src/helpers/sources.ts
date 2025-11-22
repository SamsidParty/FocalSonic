import { getFetchHeaders } from "../auth/headers";
import { webPlaybackURL } from "./constants";

export async function getWebContentSources(contentID: string) {
    try {
        const request = await fetch(webPlaybackURL, {
            method: "POST",
            headers: { ...await getFetchHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ salableAdamId: contentID }),
        });
        const response = await request.json();
        if (response?.status === 0) {
            return response?.songList;
        }
    }
    catch { }

    return null;
}

export function findBestWebContentSource(sources: any[]) {
    if (sources != null && sources.length > 0) {
        const song = sources[0];
        const validAssets = song?.assets?.filter((asset: any) => asset.URL && asset.URL.includes(".m3u8") && asset.flavor.includes(":ctrp")); // ctrp = compatible with widevine

        // Find the asset with the highest bitrate
        let bestAsset = null;
        let highestBitrate = -1;

        for (const asset of validAssets) {
            if (asset.metadata?.bitRate > highestBitrate) {
                highestBitrate = asset.metadata?.bitRate;
                bestAsset = asset;
            }
        }

        return bestAsset || null;
    }

    return null;
}
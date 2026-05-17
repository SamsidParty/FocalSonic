import { getFetchHeaders } from "../auth/headers";
import { isAtmosEnabled } from "./atmos";
import { webPlaybackURL } from "./constants";
import handleError, { ERROR_CODES, errorNames } from "./error-handler";
import { tryWrapAppleMusicURL } from "./igniteview";

export interface PlaybackAsset {
    URL: string | null;
    flavor: string | null;
    desirable?: boolean;
    metadata?: {
        bitRate: number;
    };
}

export interface PlaybackSource {
    bestAsset: PlaybackAsset | null;
    backupAsset: PlaybackAsset | null;
}

export async function getContentSources(catalogID: string | null, libraryID: string | null) {
    let body = {};

    if (catalogID && !libraryID) {
        body = { salableAdamId: catalogID };
    } 
    else if (catalogID && libraryID) {
        body = { 
            subscriptionAdamId: catalogID,
            universalLibraryId: libraryID
        };
    }
    else {
        body = { universalLibraryId: libraryID };
    }
    
    // Run enhanced HLS and webPlayback requests concurrently for faster startup
    const [enhancedHls, webPlaybackResponse] = await Promise.all([
        // Enhanced HLS request (only for Atmos-enabled catalog IDs)
        (isAtmosEnabled() && catalogID) 
            ? tryGetEnhancedHLS(catalogID) 
            : Promise.resolve(undefined),
        // Main webPlayback request
        fetch(webPlaybackURL, {
            method: "POST",
            headers: { ...await getFetchHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }).then(res => res.json())
    ]);

    // Merge enhanced HLS assets into the response if available
    if (enhancedHls && webPlaybackResponse?.songList?.[0]?.assets) {
        enhancedHls.forEach((asset) => webPlaybackResponse.songList[0].assets.push(asset));
    }

    if (!webPlaybackResponse?.songlist && webPlaybackResponse?.failureType) {
        // Something went wrong, throw a real fatal error
        console.warn("[FocalMK] Apple Music webPlayback request failed", webPlaybackResponse.failureType);

        // However, in case the error is no active subscription, we can try recovering by using the preview source instead
        if (ERROR_CODES[webPlaybackResponse?.failureType as string] === errorNames.SUBSCRIPTION_ERROR) {
            console.warn("[FocalMK] User does not have an active subscription, attempting to find preview source");
            // Try to resolve preview sources
            const previewSources = await tryGetPreview(catalogID!);

            if (previewSources && previewSources[0]?.URL) {
                // We found a preview playback URL. Use it
                console.warn("[FocalMK] Preview source found, only a small part of the song will play");

                // Non-fatal error dialog
                handleError("An active Apple Music subscription is required to use this app. A shorter, low-quality preview of the song will be played insteaf.", false);

                return [{ assets: previewSources }]; 
            }

            console.error("[FocalMK] No preview source found, playback will fail");
        }

        const message = webPlaybackResponse?.dialog?.message;
        throw new Error(message);
    }
    
    return webPlaybackResponse?.songList || null;
}

export async function tryGetEnhancedHLS(contentID: string): Promise<PlaybackAsset[]> {
    try {
        if (!isAtmosEnabled()) return [{ URL: null, flavor: null }];
        const catalogURL = tryWrapAppleMusicURL(`https://amp-api.music.apple.com/v1/catalog/{storefront}/songs/${contentID}?extend=extendedAssetUrls`);
        const request = await fetch(catalogURL);
        const response = await request.json();
        const assets = response?.data?.[0]?.attributes?.extendedAssetUrls;
        return Object.entries(assets).map((asset) => {
            return { URL: asset[1], flavor: asset[0], desirable: response?.data?.[0]?.attributes?.audioTraits?.includes("atmos") && isAtmosEnabled() };
        }) as PlaybackAsset[];
    }
    catch {}

    return [];
}

export async function tryGetPreview(contentID: string): Promise<PlaybackAsset[]> {
    try {
        const catalogURL = tryWrapAppleMusicURL(`https://amp-api.music.apple.com/v1/catalog/{storefront}/songs/${contentID}`);
        const request = await fetch(catalogURL);
        const response = await request.json();
        const assets = response?.data?.[0]?.attributes?.previews;
        return assets.map((asset: any) => {
            return { URL: asset.url, desirable: true };
        }) as PlaybackAsset[];
    }
    catch {}

    return [];
}

export function findBestContentSource(sources: any[]): PlaybackSource {
    if (sources != null && sources.length > 0) {
        const song = sources[0];
        const validAssets = song?.assets?.filter((asset: any) => {
            const hasURL = asset.URL;
            const hasFlavor = asset.flavor;
            const isCtrp = asset.flavor?.toLowerCase().includes("ctrp");  // ctrp = compatible with widevine
            const isEnhancedHls = asset.flavor?.toLowerCase().includes("enhancedhls");
            return hasURL && (isCtrp || isEnhancedHls || !hasFlavor);
        });

        // Find the asset with the highest bitrate
        let bestAsset = null;
        let backupAsset = null;
        let highestBitrate = -1;

        for (const asset of validAssets) {
            if (asset.metadata?.bitRate > highestBitrate) {
                highestBitrate = asset.metadata?.bitRate;
                bestAsset = asset;
                backupAsset = asset;
            }

            if (asset.desirable) {
                bestAsset = asset;
                break;
            }
        }

        return { bestAsset, backupAsset };
    }

    return { bestAsset: null, backupAsset: null };
}
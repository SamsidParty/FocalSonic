import { getAudioElement } from "../helpers/dom";
import { FocalHls } from "../helpers/hls-instance";
import { findBestContentSource, getContentSources } from "../helpers/sources";
import Hls from "../playback/hls.js";

export async function loadContent(hls: FocalHls, contentID: string) {
    try {

        const isCatalogId = !isNaN(contentID as unknown as any);
        const isCombinedId = contentID.split("/").length === 2; // Where both catalog and library ID are concated together

        let catalogID: string | null = null;
        let libraryID: string | null = null;

        if (isCatalogId) {
            catalogID = contentID;
        }
        else if (isCombinedId) {
            catalogID = contentID.split("/")[0];
            libraryID = contentID.split("/")[1];
        }
        else {
            libraryID = contentID;
        }

        const sources = await getContentSources(catalogID, libraryID);
        const mainSource = findBestContentSource(sources);
        if (!mainSource.bestAsset) throw new Error("[FocalMK] No valid content source found");

        let sourceURL = mainSource.bestAsset?.URL;
        
        if (!sourceURL?.endsWith(".m3u8")) {
            console.warn("[FocalMK] Content source is not an HLS stream, falling back to default player");
            getAudioElement().crossOrigin = "anonymous"; // Set CORS to anonymous for direct playback through blob storage
            getAudioElement().src = sourceURL!;
            return;
        }

        console.log("[FocalMK] Using content source:", mainSource.bestAsset?.flavor);


        await new Promise<void>((resolve) => {
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                console.log("[FocalMK] Playback ready");
                resolve();
            });

            hls.playbackSource = mainSource;
            hls.useDesirableAsset = mainSource.bestAsset?.desirable || false;
            hls.contentID = catalogID || libraryID || null!;
            hls.loadSource(sourceURL);
        });
    }
    catch (err) {
        // Loading content can fail for non-active / preloaded sources (e.g. PSSH
        // generation throwing before the source is ever the active one). These are
        // not user-facing playback errors, so log them instead of surfacing a dialog.
        console.error("Error loading content:", err);
    }
}
import { getAudioElement } from "../helpers/dom";
import { getActiveHlsInstance } from "../helpers/hls-instance";
import { findBestContentSource, getContentSources } from "../helpers/sources";
import Hls from "../playback/hls.js";

export async function loadContent(contentID: string) {
    try {
        const sources = await getContentSources(contentID);
        const bestSource = findBestContentSource(sources);
        if (!bestSource) throw new Error("[FocalMK] No valid content source found");

        let sourceURL = bestSource.URL;
        
        if (!sourceURL.endsWith(".m3u8")) {
            console.warn("[FocalMK] Content source is not an HLS stream, falling back to default player");
            getAudioElement().crossOrigin = "anonymous"; // Set CORS to anonymous for direct playback through blob storage
            getAudioElement().src = sourceURL;
            return;
        }

        console.log("[FocalMK] Using content source:", bestSource.flavor);


        await new Promise<void>((resolve) => {
            getActiveHlsInstance().on(Hls.Events.MEDIA_ATTACHED, () => {
                console.log("[FocalMK] Playback ready");
                resolve();
            });

            getActiveHlsInstance().contentID = contentID;
            getActiveHlsInstance().loadSource(sourceURL);
        });
    }
    catch (err) {
        // TODO: Handle error
        console.error("Error loading content:", err);
    }
}
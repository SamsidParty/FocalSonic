import { getAudioElement } from "../helpers/dom";
import { FocalHls } from "../helpers/hls-instance";
import { findBestContentSource, getContentSources } from "../helpers/sources";
import Hls from "../playback/hls.js";

export async function loadContent(hls: FocalHls, contentID: string) {
    try {
        const sources = await getContentSources(contentID);
        const mainSource = findBestContentSource(sources);
        if (!mainSource) throw new Error("[FocalMK] No valid content source found");

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
            hls.contentID = contentID;
            hls.loadSource(sourceURL);
        });
    }
    catch (err) {
        // TODO: Handle error
        console.error("Error loading content:", err);
    }
}
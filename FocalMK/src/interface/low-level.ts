import { isAtmosEnabled } from "../helpers/atmos";
import { focalHls } from "../helpers/hls-instance";
import { findBestWebContentSource, getWebContentSources } from "../helpers/sources";

export async function loadContent(contentID: string) {
    try {
        const sources = await getWebContentSources(contentID);
        const bestSource = findBestWebContentSource(sources);
        if (!bestSource) throw new Error("No valid content source found");

        let sourceURL = bestSource.URL;
        
        if (isAtmosEnabled()) {
            sourceURL = "";
        }

        console.log("Using content source:", bestSource.flavor);

        focalHls.contentID = contentID;
        focalHls.loadSource(sourceURL);
    }
    catch (err) {
        // TODO: Handle error
        console.error("Error loading content:", err);
    }
}
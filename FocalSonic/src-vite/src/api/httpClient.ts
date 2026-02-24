import { useAppStore } from "@/store/app.store";
import { CoverArt } from "@/types/coverArtType";
import { AuthType } from "@/types/serverConfig";
import { appName } from "@/utils/appName";
import { saltWord } from "@/utils/salt";
import { checkServerType } from "@/utils/servers";
import omit from "lodash/omit";

export type QueryType = Record<string, string | number | undefined>

export interface FetchOptions extends RequestInit {
    query?: QueryType
}

type AuthParams = { u: string; t: string; s: string } | { u: string; p: string }

export function authQueryParams(
    username: string,
    password: string,
    authType: AuthType | null,
): AuthParams {
    if (authType === AuthType.TOKEN) {
        return {
            u: username ?? "",
            t: password ?? "",
            s: saltWord,
        };
    } else {
        return {
            u: username ?? "",
            p: password ?? "",
        };
    }
}

function queryParams() {

    const { username, password, authType, protocolVersion } =
    useAppStore.getState().data;

    return {
        ...authQueryParams(username, password, authType),
        v: protocolVersion || "1.16.0",
        c: appName,
        f: "json",
    };
}

function getUrl(path: string, options?: QueryType) {
    const serverUrl = useAppStore.getState().data.url;

    const params = new URLSearchParams(serverUrl !== "applemusic" ? queryParams() : []);

    if (options) {
        Object.keys(options).forEach((key) => {
            const query = options[key];

            if (query !== undefined) {
                params.append(key, query.toString());
            }
        });
    }

    const queries = params.toString();
    const pathWithoutSlash = path.startsWith("/") ? path.substring(1) : path;
    let url = `${serverUrl}/rest/${pathWithoutSlash}`;
    url += path.includes("?") ? "&" : "?";
    url += queries;

    if (serverUrl === "applemusic") {
        url = window.igniteView?.resolverURL + "/applemusic?" + encodeURIComponent(url.replace("applemusic/rest/applemusic/", ""));
    }

    return url;
}

async function browserFetch<T>(
    url: string,
    options: RequestInit,
): Promise<{ count: number; data: T } | undefined> {
    try {
        const response = await fetch(url, options);
        const { isAppleMusic } = checkServerType();

        if (response.status === 204) {
            return null;
        }
        else if (response.ok) {
            const data = await response.json();
            return isAppleMusic ? data : {
                count: parseInt(response.headers.get("x-total-count") || "0", 10),
                data: (data["subsonic-response"] as T),
            };
        }
    } catch (error) {
        console.error("Error on browserFetch request", error);
        return undefined;
    }
}

export async function httpClient<T>(
    path: string,
    options: FetchOptions,
): Promise<{ count: number; data: T } | undefined> {
    try {
        const url = getUrl(path, options.query);
        const init = omit(options, "query");

        return await browserFetch<T>(url, init);
    } catch (error) {
        console.error("Error on httpClient request", error);
        return undefined;
    }
}

export function getCoverArtUrl(
    id?: string,
    type: CoverArt = "album",
    size = "300"
): string {

    const { isAppleMusic } = checkServerType();

    // No point proxying apple music cover art URLs, let it get served through the CDN directly
    if (id?.startsWith("https://") || id?.startsWith("http://")) {

        if (isBlobstorePresignedS3Url(id) && window?.igniteView) {
            // Proxy through igniteview to cache the blobstore URL
            return window.igniteView.resolverURL + "/s3imageproxy?" + encodeURIComponent(id);
        }

        return id.replaceAll("{w}", size).replaceAll("{h}", size).replaceAll("{f}", "jpeg");
    }


    if (!id) {
        // everything except artists uses the same default cover art
        type = type === "artist" ? "artist" : "album";
        return `/default_${type}_art.png`;
    }
    
    return getUrl("getCoverArt", {
        id,
        size,
    });
}

function isBlobstorePresignedS3Url(urlStr: string): boolean {
    let url: URL;
    try {
        url = new URL(urlStr);
    } catch {
        return false;
    }

    // Must match apple blobstore hostname
    if (!url.hostname.includes(".blobstore.apple.com")) return false;

    // Heuristic: presigned S3-style params
    // Includes:
    //  - X-Amz-Algorithm
    //  - X-Amz-Date
    //  - X-Amz-SignedHeaders
    //  - X-Amz-Expires
    //  - X-Amz-Credential
    //  - X-Amz-Signature
    const qp = url.searchParams;

    const required = [
        "X-Amz-Algorithm",
        "X-Amz-Date",
        "X-Amz-Expires",
        "X-Amz-Credential",
        "X-Amz-Signature",
    ];

    return required.every((k) => qp.has(k));
}

export function getSongStreamUrl(
    id: string,
    contentType?: string,
) {

    if (checkServerType().isAppleMusic) {
        return id; // We only need the ID for streaming apple music
    }

    // TODO: Fix flac support in native audio
    const format = "mp3";

    return getUrl("stream", {
        id,
        maxBitRate: 0,
        format,
    });
}

export function getDownloadUrl(id: string, maxBitRate = "0", format = "raw") {
    return getUrl("download", {
        id,
        maxBitRate,
        format,
    });
}

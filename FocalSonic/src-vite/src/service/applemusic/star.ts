import { httpClient } from "@/api/httpClient";

export type StarItemType = "song" | "album" | "artist";

// Apple Music's ratings endpoint needs the correct resource type in the path.
// Library items (non-numeric ids) use the "library-" prefixed types, while
// catalog items (numeric ids) use the plain types. See getOne() for the same
// catalog-vs-library id convention.
function resolveResourceType(id: string, type: StarItemType): string {
    const isCatalogId = !!parseInt(id);

    switch (type) {
        case "album":
            return isCatalogId ? "albums" : "library-albums";
        case "artist":
            return isCatalogId ? "artists" : "library-artists";
        case "song":
        default:
            return isCatalogId ? "songs" : "library-songs";
    }
}

async function starItem(id: string, type: StarItemType = "song") {
    const resource = resolveResourceType(id, type);

    await httpClient<any>(`/applemusic/me/ratings/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(
            {
                type: "rating",
                attributes: {
                    value: 1
                }
            }
        )
    });
}

async function unstarItem(id: string, type: StarItemType = "song") {
    const resource = resolveResourceType(id, type);

    await httpClient<any>(`/applemusic/me/ratings/${resource}/${id}`, {
        method: "DELETE",
    });
}

interface HandleStarItem {
    id: string
    starred: boolean
    type?: StarItemType
}

async function handleStarItem({ id, starred, type = "song" }: HandleStarItem) {
    if (starred) {
        await unstarItem(id, type);
    } else {
        await starItem(id, type);
    }
}

export const star = {
    starItem,
    unstarItem,
    handleStarItem,
};

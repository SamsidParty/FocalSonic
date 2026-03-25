import { ItemMenuOptions, ItemMenuTarget, PreviewPlaylistItem } from "@/app/components/options/item-menu";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import { ISimilarArtist } from "@/types/responses/artist";
import { Playlist } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";

type PreviewMenuItem =
    | Albums
    | AppleMusicRecommendationContent
    | ISimilarArtist
    | Playlist
    | ISong
    | PreviewPlaylistItem;

function isAppleMusicRecommendationContent(item: PreviewMenuItem): item is AppleMusicRecommendationContent {
    return "type" in item && "attributes" in item;
}

function isSong(item: PreviewMenuItem): item is ISong {
    return "albumId" in item && "title" in item;
}

function isArtist(item: PreviewMenuItem): item is ISimilarArtist {
    return "albumCount" in item && "name" in item;
}

function isPlaylist(item: PreviewMenuItem): item is Playlist | PreviewPlaylistItem {
    if ("owner" in item || "public" in item || "changed" in item) {
        return true;
    }

    if (isAppleMusicRecommendationContent(item)) {
        return item.type.toLowerCase().includes("playlist");
    }

    return false;
}

function isAlbum(item: PreviewMenuItem): item is Albums {
    return "songCount" in item && "artist" in item && !isArtist(item) && !isPlaylist(item);
}

function buildAppleMusicTarget(item: AppleMusicRecommendationContent): ItemMenuTarget | null {
    const type = item.type.toLowerCase();

    if (type === "stations") {
        return null;
    }

    if (type.includes("artist")) {
        return {
            type: "artist",
            item: {
                id: item.id,
                name: item.attributes?.name ?? "",
                coverArt: "",
                albumCount: 0,
                artistImageUrl: "",
            },
        };
    }

    if (type.includes("playlist")) {
        return {
            type: "playlist",
            item: {
                id: item.id,
                name: item.attributes?.name ?? "",
                comment: "",
                public: false,
                owner: item.attributes?.curatorName ?? "",
                created: "",
                changed: "",
                coverArt: item.attributes?.artwork?.url ?? "",
                appleMusic: {
                    data: {
                        canEdit: false,
                    },
                    type: item.type,
                },
            },
            context: {
                showPlay: true,
                disableEdit: true,
                disableDelete: true,
            },
        };
    }

    if (type.includes("album")) {
        return {
            type: "album",
            item: {
                id: item.id,
                name: item.attributes?.name ?? "",
                artist: item.attributes?.artistName ?? "",
                artistId: item.relationships?.artists?.data?.[0]?.id,
                coverArt: item.attributes?.artwork?.url ?? "",
                songCount: 0,
                duration: 0,
                created: "",
                genre: "",
                userRating: 0,
                genres: [],
                musicBrainzId: "",
                isCompilation: false,
                sortName: item.attributes?.name ?? "",
                discTitles: [],
                displayArtist: item.attributes?.artistName ?? "",
            },
        };
    }

    return null;
}

export function getPreviewItemTarget(item: PreviewMenuItem): ItemMenuTarget | null {
    if (isAppleMusicRecommendationContent(item)) {
        return buildAppleMusicTarget(item);
    }

    if (isSong(item)) {
        return {
            type: "song",
            item,
            index: 0,
        };
    }

    if (isArtist(item)) {
        return {
            type: "artist",
            item,
        };
    }

    if (isPlaylist(item)) {
        return {
            type: "playlist",
            item,
            context: {
                showPlay: true,
            },
        };
    }

    if (isAlbum(item)) {
        return {
            type: "album",
            item,
        };
    }

    return null;
}

export function PreviewItemMenuOptions({
    item,
    variant = "context",
}: {
    item: PreviewMenuItem
    variant?: "context" | "dropdown"
}) {
    const target = getPreviewItemTarget(item);

    if (!target) {
        return null;
    }

    return <ItemMenuOptions variant={variant} target={target} />;
}
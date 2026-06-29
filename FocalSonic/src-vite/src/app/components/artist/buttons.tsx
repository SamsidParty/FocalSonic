import { Actions } from "@/app/components/actions";
import { useLibraryVersion } from "@/app/hooks/use-library-sync";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import * as localLibrary from "@/lib/localLibrary";
import { toggleFavorite } from "@/lib/sync/favorites";
import { useAppPages } from "@/store/app.store";
import { usePlayerActions } from "@/store/player.store";
import { IArtist } from "@/types/responses/artist";
import { checkServerType } from "@/utils/servers";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface ArtistButtonsProps {
    artist: IArtist
    showInfoButton: boolean
    isArtistEmpty: boolean
}

export function ArtistButtons({
    artist,
    showInfoButton,
    isArtistEmpty,
}: ArtistButtonsProps) {
    const { t } = useTranslation();
    const { setSongList } = usePlayerActions();
    const { showInfoPanel, toggleShowInfoPanel } = useAppPages();
    const { playArtistRadio } = usePlayArtistRadio();
    const { isAppleMusic } = checkServerType();

    const libraryVersion = useLibraryVersion();
    const isArtistStarred = useMemo(
        () => localLibrary.isFavorite("artist", artist.id) || artist.starred !== undefined,
        [artist.id, artist.starred, libraryVersion],
    );

    function handleLikeButton() {
        if (!artist) return;
        toggleFavorite("artist", artist.id, isArtistStarred);
    }


    const buttonsTooltips = {
        play: t("playlist.buttons.play", { name: artist.name }),
        shuffle: t("playlist.buttons.shuffle", { name: artist.name }),
        options: t("playlist.buttons.options", { name: artist.name }),
        like: () => {
            return isArtistStarred
                ? t("album.buttons.dislike", { name: artist.name })
                : t("album.buttons.like", { name: artist.name });
        },
        info: () => {
            return showInfoPanel ? t("generic.hideDetails") : t("generic.showDetails");
        },
    };

    if (isArtistEmpty) {
        return <div className="h-8 w-full" />;
    }

    return (
        <Actions.Container>
            <Actions.Button
                tooltip={buttonsTooltips.play}
                buttonStyle="primary"
                onClick={() => playArtistRadio(artist)}
            >
                <Actions.PlayIcon />
            </Actions.Button>

            {!isAppleMusic && (
                <Actions.Button
                    tooltip={buttonsTooltips.like()}
                    onClick={handleLikeButton}
                >
                    <Actions.LikeIcon isStarred={isArtistStarred} />
                </Actions.Button>
            )}


            {showInfoButton && (
                <Actions.Button
                    tooltip={buttonsTooltips.info()}
                    onClick={toggleShowInfoPanel}
                >
                    <Actions.InfoIcon />
                </Actions.Button>
            )}
        </Actions.Container>
    );
}

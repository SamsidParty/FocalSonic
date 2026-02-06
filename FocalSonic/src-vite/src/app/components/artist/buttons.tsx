import { Actions } from "@/app/components/actions";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import { service } from "@/service/service";
import { useAppPages } from "@/store/app.store";
import { usePlayerActions } from "@/store/player.store";
import { IArtist } from "@/types/responses/artist";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
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

    const isArtistStarred = artist.starred !== undefined;

    const queryClient = useQueryClient();

    const starMutation = useMutation({
        mutationFn: service.star.handleStarItem,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [queryKeys.artist.single, artist.id],
            });
        },
    });

    function handleLikeButton() {
        if (!artist) return;
        starMutation.mutate({
            id: artist.id,
            starred: isArtistStarred,
        });
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

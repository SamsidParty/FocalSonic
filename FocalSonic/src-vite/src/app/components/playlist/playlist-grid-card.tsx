import { getCoverArtUrl } from "@/api/httpClient";
import { PreviewItemMenuOptions } from "@/app/components/options/preview-item-menu";
import { PreviewCard } from "@/app/components/preview-card/card";
import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { Playlists } from "@/types/responses/playlist";
import { FolderIcon, Shuffle } from "lucide-react";
import React, { memo } from "react";

import { Button } from "../ui/button";

type PlaylistCardProps = {
    playlist: Playlists
}

function PlaylistCard({ playlist }: PlaylistCardProps) {
    const { setSongList } = usePlayerActions();

    if (playlist?.appleMusic?.type?.includes("playlist-folders")) {
        return (
            <PreviewCard.Root contextMenuOptions={<PreviewItemMenuOptions item={playlist} variant="context" />}>
                <PreviewCard.ImageWrapper link={ROUTES.PLAYLIST.PAGE(playlist.id)}>
                    <div className="flex items-center justify-center w-full h-full">  
                        <FolderIcon color="var(--primary)" className="w-1/2 h-1/2 group-hover:opacity-40 transition-opacity duration-300" />
                    </div>
                </PreviewCard.ImageWrapper>
                <PreviewCard.InfoWrapper>
                    <PreviewCard.Title link={ROUTES.PLAYLIST.PAGE(playlist.id)}>
                        {playlist.name}
                    </PreviewCard.Title>
                </PreviewCard.InfoWrapper>
            </PreviewCard.Root>
        );
    }

    async function handlePlayPlaylist(shuffle = false) {
        const response = await service.playlists.getOne(playlist.id);
        if (response) {
            setSongList(response.entry, 0, shuffle);
        }
    }

    return (
        <PreviewCard.Root contextMenuOptions={<PreviewItemMenuOptions item={playlist} variant="context" />}>
            <PreviewCard.ImageWrapper link={ROUTES.PLAYLIST.PAGE(playlist.id)}>
                <PreviewCard.Image
                    src={getCoverArtUrl(playlist.coverArt, "playlist", "300")}
                    alt={playlist.name}
                />
                <PreviewCard.PlayButton onClick={handlePlayPlaylist} >
                    <Button
                        className="opacity-0 p-2 group-hover:opacity-75 transition-all duration-300 rounded-full w-8 h-8 z-20 ml-auto"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handlePlayPlaylist(true);
                        }}
                    >
                        <Shuffle className="stroke-foreground hover:scale-110 transition-transform duration-300" />
                    </Button>
                </PreviewCard.PlayButton>
            </PreviewCard.ImageWrapper>
            <PreviewCard.InfoWrapper>
                <PreviewCard.Title link={ROUTES.PLAYLIST.PAGE(playlist.id)}>
                    {playlist.name}
                </PreviewCard.Title>
                <PreviewCard.Subtitle
                    enableLink={playlist.artistId !== undefined}
                    link={ROUTES.ARTIST.PAGE(playlist.artistId ?? "")}
                >
                    {playlist.artist}
                </PreviewCard.Subtitle>
            </PreviewCard.InfoWrapper>
        </PreviewCard.Root>
    );
}

export const PlaylistGridCard = memo(PlaylistCard);

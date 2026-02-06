import { getCoverArtUrl } from "@/api/httpClient";
import { PreviewCard } from "@/app/components/preview-card/card";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import { useSongList } from "@/app/hooks/use-song-list";
import { ROUTES } from "@/routes/routesList";
import { usePlayerActions } from "@/store/player.store";
import { ISimilarArtist } from "@/types/responses/artist";
import { checkServerType } from "@/utils/servers";
import { memo } from "react";
import { useTranslation } from "react-i18next";

type ArtistCardProps = {
    artist: ISimilarArtist
}

function ArtistCard({ artist }: ArtistCardProps) {
    const { t } = useTranslation();
    const { getArtistAllSongs } = useSongList();
    const { setSongList } = usePlayerActions();
    const { isAppleMusic } = checkServerType();
    const { playArtistRadio } = usePlayArtistRadio();

    return (
        <PreviewCard.Root className="flex flex-col w-full h-full">
            <PreviewCard.ImageWrapper link={ROUTES.ARTIST.PAGE(artist.id)} className="flex-none aspect-square">
                <PreviewCard.Image
                    src={getCoverArtUrl(artist.coverArt, "artist")}
                    alt={artist.name}
                />
                <PreviewCard.PlayButton onClick={() => playArtistRadio(artist)} />
            </PreviewCard.ImageWrapper>
            <PreviewCard.InfoWrapper>
                <PreviewCard.Title link={ROUTES.ARTIST.PAGE(artist.id)}>
                    {artist.name}
                </PreviewCard.Title>
                <PreviewCard.Subtitle enableLink={false}>
                    {artist.albumCount && t("artist.info.albumsCount", {
                        count: artist.albumCount,
                    })}
                </PreviewCard.Subtitle>
            </PreviewCard.InfoWrapper>
        </PreviewCard.Root>
    );
}

export const ArtistGridCard = memo(ArtistCard);

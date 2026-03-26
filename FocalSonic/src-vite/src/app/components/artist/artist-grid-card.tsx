import { getCoverArtUrl } from "@/api/httpClient";
import { ItemMenuOptions } from "@/app/components/options/item-menu";
import { PreviewCard } from "@/app/components/preview-card/card";
import usePlayArtistRadio from "@/app/hooks/use-play-artist-radio";
import { ROUTES } from "@/routes/routesList";
import { ISimilarArtist } from "@/types/responses/artist";
import { useTranslation } from "react-i18next";

type ArtistCardProps = {
    artist: ISimilarArtist
}

export function ArtistGridCard({ artist }: ArtistCardProps) {
    const { t } = useTranslation();
    const { playArtistRadio } = usePlayArtistRadio();

    return (
        <PreviewCard.Root
            className="flex flex-col w-full h-full"
            contextMenuOptions={<ItemMenuOptions variant="context" target={{ type: "artist", item: artist }} />}
        >
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

import { IArtist } from "@/types/responses/artist";
import { ItemMenuOptions } from "@/app/components/options/item-menu";

interface ArtistOptionsProps {
    artist: IArtist
    variant?: "context" | "dropdown"
}

export function ArtistOptions({ artist, variant = "dropdown" }: ArtistOptionsProps) {
    return <ItemMenuOptions variant={variant} target={{ type: "artist", item: artist }} />;
}

import { ItemMenuOptions } from "@/app/components/options/item-menu";
import { SingleAlbum } from "@/types/responses/album";

interface AlbumOptionsProps {
    album: SingleAlbum
}

export function AlbumOptions({ album }: AlbumOptionsProps) {
    return <ItemMenuOptions variant="dropdown" target={{ type: "album", item: album }} />;
}

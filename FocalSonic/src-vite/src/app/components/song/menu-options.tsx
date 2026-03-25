import { ItemMenuContext, ItemMenuOptions } from "@/app/components/options/item-menu";
import { ISong } from "@/types/responses/song";

interface SongMenuOptionsProps {
    variant: "context" | "dropdown"
    song: ISong
    index: number
    context?: ItemMenuContext
}

export function SongMenuOptions({
    variant,
    song,
    index,
    context,
}: SongMenuOptionsProps) {
    return <ItemMenuOptions variant={variant} target={{ type: "song", item: song, index, context }} />;
}

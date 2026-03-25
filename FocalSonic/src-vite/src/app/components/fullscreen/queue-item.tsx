import clsx from "clsx";
import { ContextMenuProvider } from "@/app/components/table/context-menu";
import { GripVertical } from "lucide-react";
import { ComponentPropsWithRef, ReactNode } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { getCoverArtUrl } from "@/api/httpClient";
import { EqualizerBars } from "@/app/components/icons/equalizer-bars";
import { ISong } from "@/types/responses/song";
import { convertSecondsToTime } from "@/utils/convertSecondsToTime";
import { ALBUM_ARTISTS_MAX_NUMBER } from "@/utils/multipleArtists";

type QueueItemProps = ComponentPropsWithRef<"div"> & {
    song: ISong
    index: number
    isPlaying: boolean
    contextMenuOptions?: ReactNode
}

export function QueueItem({
    song,
    isPlaying,
    index,
    style,
    contextMenuOptions,
    ...props
}: QueueItemProps) {
    const coverArtUrl = getCoverArtUrl(song.coverArt, "song", "100");

    return (
        <ContextMenuProvider options={contextMenuOptions}>
            <div
                className={clsx([
                    "flex items-center w-[calc(100%-10px)] h-16 text-sm rounded-md cursor-pointer",
                    "bg-black/0 hover:bg-foreground/20",
                    "data-[state=active]:bg-foreground data-[state=active]:text-secondary",
                    "cursor-grab active:cursor-grabbing",
                ])}
                style={{
                    backfaceVisibility: "visible",
                    willChange: "background-color",
                    ...style,
                }}
                {...props}
            >
                <div className="w-8 h-full flex items-center justify-center text-foreground/35">
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-[54px] h-full flex items-center justify-center text-center font-medium">
                    {isPlaying ? (
                        <div className="w-6 flex items-center">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <EqualizerBars size={20} className="text-secondary mb-1" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-6 h-6 text-center flex justify-center items-center drop-shadow-lg">
                            <p>{index + 1}</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-1 items-center min-w-0">
                    <div className="w-10 h-10 bg-accent rounded mr-2 shrink-0">
                        <LazyLoadImage
                            src={coverArtUrl}
                            className="w-10 h-10 rounded text-transparent"
                            alt={`${song.title} - ${song.artist}`}
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate">{song.title}</span>
                        <QueueArtists song={song} />
                    </div>
                </div>
                <div className="w-[100px] text-center shrink-0">
                    {convertSecondsToTime(song.duration)}
                </div>
            </div>
        </ContextMenuProvider>
    );
}

function QueueArtists({ song }: { song: ISong }) {
    const { artist, artists } = song;

    if (artists && artists.length > 1) {
        const data = artists.slice(0, ALBUM_ARTISTS_MAX_NUMBER);

        return (
            <div className="flex items-center gap-1 font-normal opacity-70">
                {data.map(({ id, name }, index) => (
                    <div key={id} className="flex items-center text-sm">
                        <p>{name}</p>
                        {index < data.length - 1 && ","}
                    </div>
                ))}
            </div>
        );
    }

    return <p className="font-normal text-sm opacity-70">{artist}</p>;
}

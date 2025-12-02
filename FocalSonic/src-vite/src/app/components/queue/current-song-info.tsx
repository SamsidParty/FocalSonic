import { getCoverArtUrl } from "@/api/httpClient";
import { LinkWithoutTo } from "@/app/components/song/artist-link";
import { AspectRatio } from "@/app/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routesList";
import { useMainDrawerState, usePlayerSonglist } from "@/store/player.store";
import { usePlayerStyle } from "@/store/theme.store";
import { ISong } from "@/types/responses/song";
import { ALBUM_ARTISTS_MAX_NUMBER } from "@/utils/multipleArtists";
import clsx from "clsx";
import React from "react";
import { Link } from "react-router-dom";
import CoverArtImage from "../cover-art";

export function CurrentSongInfo() {
    const { currentSong } = usePlayerSonglist();
    const { closeDrawer } = useMainDrawerState();
    const { isMiniPlayer } = usePlayerStyle();

    const imageUrl = getCoverArtUrl(currentSong.coverArt, "song", "1200");

    return (
        <div className={
            clsx(
                "ml-[8vw] xxs:ml-0 xxs:mr-0 xxs:w-[100vh] lg:block w-[35vw]"
            )}
        >
            <AspectRatio
                ratio={1 / 1}
                className="shadow-header-image rounded-md overflow-hidden bg-accent"
            >
                <CoverArtImage
                    id="song-info-image"
                    animated
                    src={imageUrl}
                    key={imageUrl}
                    animationCatalogID={currentSong.id}
                    effect="opacity"
                    alt={`${currentSong.artist} - ${currentSong.title}`}
                    className="rounded-md aspect-square object-cover text-transparent"
                    width="100%"
                    height="100%"
                />
            </AspectRatio>

            <div className="flex flex-col items-center justify-center mt-6 xxs:hidden px-1">
                <h4 className="scroll-m-20 text-xl xxs:hidden font-bold tracking-tight text-center text-balance text-white drop-shadow-md">
                    {currentSong.albumId ? (
                        <Link
                            to={ROUTES.ALBUM.PAGE(currentSong.albumId)}
                            className="hover:underline"
                            onClick={closeDrawer}
                        >
                            {currentSong.title}
                        </Link>
                    ) : (
                        <>{currentSong.title}</>
                    )}
                </h4>

                <p className="leading-5 mt-1 xxs:hidden drop-shadow-md flex items-center text-white opacity-60 justify-center flex-wrap gap-1">
                    <QueueArtistsLinks song={currentSong} />
                </p>
            </div>
        </div>
    );
}

function QueueArtistsLinks({ song }: { song: ISong }) {
    const { closeDrawer } = useMainDrawerState();
    const { artist, artistId, artists } = song;

    if (artists && artists.length > 1) {
        const data = artists.slice(0, ALBUM_ARTISTS_MAX_NUMBER);

        return (
            <>
                {data.map(({ id, name }, index) => (
                    <div key={id}>
                        <ArtistLink id={id} name={name} onClick={closeDrawer} />
                        {index < data.length - 1 && ","}
                    </div>
                ))}
            </>
        );
    }

    return <ArtistLink id={artistId} name={artist} onClick={closeDrawer} />;
}

type ArtistLinkProps = LinkWithoutTo & {
    id?: string
    name: string
}

function ArtistLink({ id, name, className, ...props }: ArtistLinkProps) {
    return (
        <Link
            className={cn(
                className,
                id ? "hover:underline hover:text-foreground" : "pointer-events-none",
            )}
            to={ROUTES.ARTIST.PAGE(id ?? "")}
            {...props}
        >
            {name}
        </Link>
    );
}

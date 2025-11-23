import { CoverImage } from "@/app/components/table/cover-image";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/routesList";
import { useMainDrawerState } from "@/store/player.store";
import { ISong } from "@/types/responses/song";
import clsx from "clsx";
import { Link } from "react-router-dom";

export function ExplicitIcon() {
    return (
        <svg className="fill-foreground opacity-60" viewBox="0 0 9 9" width="10" height="10" aria-hidden="true">
            <path d="M3.9 7h1.9c.4 0 .7-.2.7-.5s-.3-.4-.7-.4H4.1V4.9h1.5c.4 0 .7-.1.7-.4 0-.3-.3-.5-.7-.5H4.1V2.9h1.7c.4 0 .7-.2.7-.5 0-.2-.3-.4-.7-.4H3.9c-.6 0-.9.3-.9.7v3.7c0 .3.3.6.9.6zM1.6 0h5.8C8.5 0 9 .5 9 1.6v5.9C9 8.5 8.5 9 7.4 9H1.6C.5 9 0 8.5 0 7.4V1.6C0 .5.5 0 1.6 0z"/>
        </svg>
    );
}

export function TableSongTitle({ song }: { song: ISong }) {
    return (
        <div className="flex w-full gap-2 items-center">
            <CoverImage
                coverArt={song.coverArt}
                coverArtType="song"
                altText={song.title}
            />
            <div className="flex flex-col w-full justify-center truncate">
                <span className={clsx("font-medium truncate flex gap-1 items-center")}>
                    {song.title}
                    {song.explicitStatus === "explicit" && <ExplicitIcon />}
                </span>
                <div className="flex items-center truncate text-muted-foreground">
                    <TableArtists song={song} />
                </div>
            </div>
        </div>
    );
}

type ArtistsLinksProps = {
    song: ISong
}

export function TableArtists({ song }: ArtistsLinksProps) {
    const { artists, artistId, artist } = song;

    if (artists && artists.length > 1) {
        return <ArtistsLinks song={song} />;
    }

    if (!artistId) {
        return (
            <span className="text-xs text-foreground/70 text-nowrap">{artist}</span>
        );
    }

    return <ArtistLink id={artistId} name={artist} />;
}

function ArtistsLinks({ song }: ArtistsLinksProps) {
    const { artists, artistId, artist } = song;

    if (artists && artists.length > 1) {
        return (
            <div className="flex items-center gap-1 text-xs text-foreground/70 w-full maskImage-marquee-fade-finished">
                {artists.map(({ id, name }, index) => (
                    <div key={id} className="flex items-center">
                        <ArtistLink id={id} name={name} />
                        {index < artists.length - 1 && ","}
                    </div>
                ))}
            </div>
        );
    }

    return <ArtistLink id={artistId} name={artist} />;
}

type ArtistLinkProps = {
    id?: string
    name: string
}

function ArtistLink({ id, name }: ArtistLinkProps) {
    const { mainDrawerState, closeDrawer } = useMainDrawerState();

    return (
        <Link
            to={ROUTES.ARTIST.PAGE(id ?? "")}
            className={cn("w-fit inline-flex", !id && "pointer-events-none")}
            data-testid="track-artist-url"
            onClick={() => {
                if (mainDrawerState) closeDrawer();
            }}
        >
            <span
                className={cn(
                    "text-xs text-foreground/70 text-nowrap",
                    id && "hover:underline hover:text-foreground",
                )}
            >
                {name}
            </span>
        </Link>
    );
}

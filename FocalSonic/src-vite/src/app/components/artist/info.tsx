import { CollapsibleInfo } from "@/app/components/info/collapsible-info";
import { useGetArtistInfo } from "@/app/hooks/use-artist";
import { IArtist } from "@/types/responses/artist";
import { checkServerType } from "@/utils/servers";
import React from "react";
import { Fragment } from "react/jsx-runtime";
import { ArtistButtons } from "./buttons";

interface ArtistInfoProps {
    artist: IArtist,
    allowShowingInfo?: boolean,
}

export function ArtistInfo({ artist, allowShowingInfo }: ArtistInfoProps) {
    const { data: artistInfo } = useGetArtistInfo(artist.id);
    const { isAppleMusic } = checkServerType();

    const hasInfoToShow =
    artistInfo !== undefined && artistInfo.biography !== undefined;

    const isArtistEmpty = (artist.albumCount === undefined || artist.albumCount === 0) && !isAppleMusic;

    return (
        <Fragment>
            <ArtistButtons
                artist={artist}
                showInfoButton={hasInfoToShow && allowShowingInfo}
                isArtistEmpty={isArtistEmpty}
            />

            {(hasInfoToShow && allowShowingInfo) && (
                <CollapsibleInfo
                    title={artist.name}
                    bio={artistInfo.biography}
                    lastFmUrl={artistInfo.lastFmUrl}
                    musicBrainzId={artistInfo.musicBrainzId}
                    useStateInfo={!isArtistEmpty}
                />
            )}
        </Fragment>
    );
}

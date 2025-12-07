import ImageHeader from "@/app/components/album/image-header";
import AppleArtistEnhancedHeader from "@/app/components/artist/apple-artist-enhanced-header";
import ArtistTopSongs from "@/app/components/artist/artist-top-songs";
import { ArtistInfo } from "@/app/components/artist/info";
import RelatedArtistsList from "@/app/components/artist/related-artists";
import { AlbumFallback } from "@/app/components/fallbacks/album-fallbacks";
import { PreviewListFallback } from "@/app/components/fallbacks/home-fallbacks";
import { TopSongsTableFallback } from "@/app/components/fallbacks/table-fallbacks";
import { BadgesData } from "@/app/components/header-info";
import PreviewList, { RegularPreviewCard } from "@/app/components/home/preview-list";
import InfoPanel from "@/app/components/info/info-panel";
import ListWrapper from "@/app/components/list-wrapper";
import {
    useGetArtist,
    useGetArtistInfo,
    useGetTopSongs,
} from "@/app/hooks/use-artist";
import ErrorPage from "@/app/pages/error-page";
import { ROUTES } from "@/routes/routesList";
import { sortRecentAlbums } from "@/utils/album";
import { checkServerType } from "@/utils/servers";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export default function Artist() {
    const { t } = useTranslation();
    const { artistId } = useParams() as { artistId: string };
    const { isAppleMusic } = checkServerType();

    const {
        data: artist,
        isLoading: artistIsLoading,
        isFetched,
    } = useGetArtist(artistId);
    const { data: artistInfo, isLoading: artistInfoIsLoading } = useGetArtistInfo(artist?.id);
    const { data: topSongs, isLoading: topSongsIsLoading } = useGetTopSongs(
        isAppleMusic ? artist?.id : artist?.name,
    );

    if (artistIsLoading) return <AlbumFallback />;
    if (isFetched && !artist) {
        return <ErrorPage status={404} statusText="Not Found" />;
    }
    if (!artist) return <AlbumFallback />;

    function getSongCount() {
        if (!artist) return null;
        if (artist.albumCount === undefined) return null;
        if (artist.albumCount === 0) return null;
        if (!artist.album) return null;
        let artistSongCount = 0;

        artist.album.forEach((album) => {
            artistSongCount += album.songCount;
        });

        return t("playlist.songCount", { count: artistSongCount });
    }

    function formatAlbumCount() {
        if (!artist) return null;
        if (artist.albumCount === undefined) return null;
        if (artist.albumCount === 0) return null;

        return t("artist.info.albumsCount", { count: artist.albumCount });
    }

    const albumCount = formatAlbumCount();
    const songCount = getSongCount();

    const badges: BadgesData = [
        {
            content: albumCount,
            type: "link",
            link: ROUTES.ALBUMS.ARTIST(artist.id, artist.name),
        },
        {
            content: songCount,
            type: "link",
            link: ROUTES.SONGS.ARTIST_TRACKS(artist.id, artist.name),
        },
    ];

    const recentAlbums = artist.album ? sortRecentAlbums(artist.album) : [];
    const HeaderType = isAppleMusic ? AppleArtistEnhancedHeader : ImageHeader;
    const showNewStyle = artistInfo?.appleMusic?.data?.[0]?.views?.["latest-release"].data?.[0] && topSongs?.length > 1;


    return (
        <div className="w-full">
            <HeaderType
                type={t("artist.headline")}
                title={artist.name}
                coverArtId={artist.coverArt}
                coverArtType="artist"
                coverArtSize="700"
                coverArtAlt={artist.name}
                artists={[artistInfo || artist]}
                badges={badges}
            >
                <ArtistInfo artist={artist} allowShowingInfo={!showNewStyle} />
                
                {
                    (showNewStyle && !topSongsIsLoading) && (
                        <div className="flex flex-row mb-2 mt-4 gap-4 overflow-hidden">
                            <div className="flex flex-col mt-4 gap-4 grow-0 shrink-0 basis-2/6 overflow-hidden">
                                <div className="flex flex-row mb-2 gap-4 overflow-hidden">
                                    <div className="min-w-0 grow-0 basis-1/2">
                                        <RegularPreviewCard isLarge title={t("artist.latest")} entry={artistInfo?.appleMusic?.data?.[0]?.views?.["latest-release"].data?.[0]} />
                                    </div>
                                    <div className="min-w-0 grow-0 basis-1/2">
                                        <RegularPreviewCard isLarge title={t("artist.topSong")} entry={topSongs[0]} />
                                    </div>
                                </div>
                                <div>
                                    <InfoPanel
                                        title={artistInfo?.name}
                                        bio={artistInfo?.biography}
                                        lastFmUrl={null}
                                        musicBrainzId={null}
                                        autoPullFromLastFm="artist"
                                    />
                                </div>

                            </div>
                            <div className="w-full h-full rounded basis-4/6 py-4">
                                <ArtistTopSongs embedded topSongs={topSongs} artist={artist} />
                            </div>
                        </div>
                    )
                }
            </HeaderType>

            <ListWrapper>

                {topSongsIsLoading && <TopSongsTableFallback />}


                {topSongs && !topSongsIsLoading && !showNewStyle && (
                    <ArtistTopSongs topSongs={topSongs} artist={artist} />
                )}

                {recentAlbums.length > 0 && (
                    <PreviewList
                        title={t("artist.recentAlbums")}
                        list={recentAlbums}
                        moreTitle={t("album.more.discography")}
                        moreRoute={ROUTES.ALBUMS.ARTIST(artist.id, artist.name)}
                    />
                )}

                {
                    (Object.entries(artistInfo?.appleMusic?.data?.[0]?.views || {})).reverse?.().map((view, i) => {
                        if (view[0] === "latest-release" || !(view[1]?.data?.length > 0)) return;
                        return (
                            <PreviewList
                                title={view[1]?.attributes?.title}
                                list={view[1].data}
                                key={i}
                            />
                        );
                    })
                }

                {artistInfoIsLoading && <PreviewListFallback />}
                {artistInfo?.similarArtist && !artistInfoIsLoading && (
                    <RelatedArtistsList
                        title={t("artist.relatedArtists")}
                        similarArtists={artistInfo.similarArtist}
                    />
                )}
            </ListWrapper>
        </div>
    );
}

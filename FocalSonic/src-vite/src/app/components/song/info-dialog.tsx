import { getCoverArtUrl } from "@/api/httpClient";
import { Dot } from "@/app/components/dot";
import { Badge } from "@/app/components/ui/badge";
import {
    Dialog,
    DialogContent,
} from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { useItemInfo } from "@/store/ui.store";
import { Albums, SingleAlbum } from "@/types/responses/album";
import { IArtist } from "@/types/responses/artist";
import { Playlist, PlaylistWithEntries } from "@/types/responses/playlist";
import { ISong } from "@/types/responses/song";
import { InfoItemData, InfoItemType, InfoPlaylistItem } from "@/types/uiContext";
import { convertSecondsToTime } from "@/utils/convertSecondsToTime";
import dateTime from "@/utils/dateTime";
import { formatBytes } from "@/utils/formatBytes";
import { RECORD_LABELS_MAX_NUMBER } from "@/utils/multipleArtists";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
    Calendar,
    Clock,
    Disc3,
    FileAudio,
    Gauge,
    Globe,
    HardDrive,
    Hash,
    Heart,
    Loader2,
    Music2,
    PlayCircle,
    Radio,
    Tag,
    Text,
    User,
    Users,
    Volume2,
} from "lucide-react";
import { Fragment, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type AlbumInfoData = Awaited<ReturnType<typeof service.albums.getInfo>>;
type ArtistInfoData = Awaited<ReturnType<typeof service.artists.getInfo>>;

export function SongInfoDialog() {
    const { t } = useTranslation();
    const { target, modalOpen, reset } = useItemInfo();
    const { isAppleMusic } = checkServerType();

    const targetId = target?.id ?? "";
    const targetType = target?.type;
    const targetItem = target?.item;

    const songSnapshot = targetType === "song" ? (targetItem as ISong | undefined) : undefined;
    const albumSnapshot = targetType === "album" ? (targetItem as SingleAlbum | Albums | undefined) : undefined;
    const artistSnapshot = targetType === "artist" ? (targetItem as IArtist | undefined) : undefined;
    const playlistSnapshot = targetType === "playlist"
        ? (targetItem as PlaylistWithEntries | Playlist | InfoPlaylistItem | undefined)
        : undefined;

    const songQuery = useQuery({
        queryKey: [queryKeys.song.info, targetId],
        queryFn: () => service.songs.getSong(targetId),
        enabled: modalOpen && targetType === "song" && targetId.length > 0 && !songSnapshot,
    });

    const albumQuery = useQuery({
        queryKey: [queryKeys.album.single, targetId],
        queryFn: () => service.albums.getOne(targetId),
        enabled: modalOpen && targetType === "album" && targetId.length > 0 && !albumSnapshot,
    });

    const albumInfoQuery = useQuery({
        queryKey: [queryKeys.album.info, targetId],
        queryFn: () => service.albums.getInfo(targetId),
        enabled: modalOpen && targetType === "album" && targetId.length > 0,
    });

    const artistQuery = useQuery({
        queryKey: [queryKeys.artist.single, targetId],
        queryFn: () => service.artists.getOne(targetId),
        enabled: modalOpen && targetType === "artist" && targetId.length > 0 && !artistSnapshot,
    });

    const artistInfoQuery = useQuery({
        queryKey: [queryKeys.artist.info, targetId],
        queryFn: () => service.artists.getInfo(targetId),
        enabled: modalOpen && targetType === "artist" && targetId.length > 0,
    });

    const playlistQuery = useQuery({
        queryKey: [queryKeys.playlist.single, targetId],
        queryFn: () => service.playlists.getOne(targetId),
        enabled: modalOpen && targetType === "playlist" && targetId.length > 0 && !playlistSnapshot,
    });

    function handleModalChange(value: boolean) {
        if (!value) reset();
    }

    function handleLinkClick() {
        reset();
    }

    const dialogState = getDialogState({
        targetType,
        targetItem,
        songQuery,
        albumQuery,
        albumInfoQuery,
        artistQuery,
        artistInfoQuery,
        playlistQuery,
    });

    return (
        <Dialog open={modalOpen} onOpenChange={handleModalChange}>
            <DialogContent
                className="max-w-[700px] p-0 gap-0 overflow-hidden"
                aria-describedby={undefined}
            >
                {dialogState.isLoading && (
                    <div className="flex w-full h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {!dialogState.isLoading && !dialogState.hasData && (
                    <div className="flex w-full h-64 items-center justify-center">
                        <p className="text-muted-foreground">{t("songInfo.error")}</p>
                    </div>
                )}

                {!dialogState.isLoading && dialogState.type === "song" && dialogState.song && (
                    <SongInfoContent
                        song={dialogState.song}
                        isAppleMusic={isAppleMusic}
                        onLinkClick={handleLinkClick}
                    />
                )}

                {!dialogState.isLoading && dialogState.type === "album" && dialogState.album && (
                    <AlbumInfoContent
                        album={dialogState.album}
                        albumInfo={dialogState.albumInfo}
                        onLinkClick={handleLinkClick}
                    />
                )}

                {!dialogState.isLoading && dialogState.type === "artist" && dialogState.artist && (
                    <ArtistInfoContent
                        artist={dialogState.artist}
                        artistInfo={dialogState.artistInfo}
                        onLinkClick={handleLinkClick}
                    />
                )}

                {!dialogState.isLoading && dialogState.type === "playlist" && dialogState.playlist && (
                    <PlaylistInfoContent
                        playlist={dialogState.playlist}
                        onLinkClick={handleLinkClick}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function SongInfoContent({
    song,
    isAppleMusic,
    onLinkClick,
}: {
    song: ISong
    isAppleMusic: boolean
    onLinkClick: () => void
}) {
    const { t } = useTranslation();
    const coverArtUrl = getCoverArtUrl(song.coverArt, "song", "500");
    const genres = collectGenres(song.genre, song.genres?.map(({ name }) => name));

    function formatLastPlayed() {
        if (!song.played) return "-";
        const lastPlayed = dateTime().from(dateTime(song.played), true);
        return t("table.lastPlayed", { date: lastPlayed });
    }

    return (
        <DialogLayout coverArtUrl={coverArtUrl}
            artworkAlt={song.album}
            highlighted={!!song.starred}
            hero={(
                <>
                    <Eyebrow>{t("songInfo.title")}</Eyebrow>
                    <HeroTitle>{song.title}</HeroTitle>
                    <HeroLink to={ROUTES.ALBUM.PAGE(song.albumId)} onClick={onLinkClick}>
                        {song.album}
                    </HeroLink>
                    <ArtistsLine artists={song.artists} artist={song.artist} artistId={song.artistId} onLinkClick={onLinkClick} />
                    <HeroStats>
                        <Stat icon={Clock} text={convertSecondsToTime(song.duration ?? 0)} />
                        {song.year > 0 && <Stat icon={Calendar} text={`${song.year}`} />}
                        {!isAppleMusic && song.suffix && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                                {song.suffix.toUpperCase()}
                            </Badge>
                        )}
                    </HeroStats>
                </>
            )}>
            <InfoSection title={t("songInfo.trackInfo")}>
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Hash} label={t("table.columns.id")} value={song.id ?? "-"} />
                    {song.playCount !== undefined && song.playCount > 0 && (
                        <InfoCard icon={PlayCircle} label={t("table.columns.plays")} value={`${song.playCount}`} />
                    )}
                    {!isAppleMusic && song.played && (
                        <InfoCard icon={Clock} label={t("table.columns.lastPlayed")} value={formatLastPlayed()} />
                    )}
                </div>
            </InfoSection>

            {song.albumArtists && song.albumArtists.length > 0 && (
                <InfoSection title={t("table.columns.albumArtist")}>
                    <BadgeLinks
                        items={song.albumArtists.map(({ id, name }) => ({ id, label: name, to: ROUTES.ARTIST.PAGE(id) }))}
                        icon={Users}
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}

            {song.contributors && song.contributors.length > 1 && (
                <InfoSection title={t("table.columns.contributors")}>
                    <div className="grid gap-2">
                        {song.contributors.map((contributor, index) => (
                            <div key={contributor.artist.name + index} className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary" className="capitalize text-xs">
                                    {contributor.role}
                                </Badge>
                                <span className="text-foreground">{contributor.artist.name}</span>
                            </div>
                        ))}
                    </div>
                </InfoSection>
            )}

            {genres.length > 0 && (
                <InfoSection title={t("table.columns.genres")}>
                    <BadgeLinks
                        items={genres.map((genre) => ({ id: genre, label: genre, to: ROUTES.ALBUMS.GENRE(genre) }))}
                        icon={Tag}
                        variant="neutral"
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}
            {!isAppleMusic && (
                <InfoSection title={t("songInfo.audioQuality")}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <InfoCard icon={FileAudio} label={t("table.columns.codec")} value={song.suffix?.toUpperCase() ?? "-"} />
                        <InfoCard icon={Radio} label={t("table.columns.bitrate")} value={`${song.bitRate ?? 0} kbps`} />
                        <InfoCard icon={HardDrive} label={t("table.columns.size")} value={formatBytes(song.size ?? 0)} />
                        {song.samplingRate !== undefined && song.samplingRate > 0 && (
                            <InfoCard icon={Gauge} label={t("table.columns.samplingRate")} value={`${(song.samplingRate / 1000).toFixed(1)} kHz`} />
                        )}
                        {song.channelCount !== undefined && song.channelCount > 0 && (
                            <InfoCard
                                icon={Volume2}
                                label={t("table.columns.channelCount")}
                                value={song.channelCount === 2 ? "Stereo" : song.channelCount === 1 ? "Mono" : `${song.channelCount} ch`}
                            />
                        )}
                        {song.bpm !== undefined && song.bpm > 0 && (
                            <InfoCard icon={Music2} label={t("table.columns.bpm")} value={`${song.bpm}`} />
                        )}
                    </div>
                </InfoSection>
            )}

            {song.replayGain && (
                <InfoSection title={t("songInfo.replayGain")}>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoCard label={t("table.columns.trackGain")} value={`${song.replayGain.trackGain?.toFixed(2) ?? 0} dB`} />
                        <InfoCard label={t("table.columns.trackPeak")} value={`${song.replayGain.trackPeak?.toFixed(4) ?? 1}`} />
                        <InfoCard label={t("table.columns.albumGain")} value={`${song.replayGain.albumGain?.toFixed(2) ?? 0} dB`} />
                        <InfoCard label={t("table.columns.albumPeak")} value={`${song.replayGain.albumPeak?.toFixed(4) ?? 1}`} />
                    </div>
                </InfoSection>
            )}
        </DialogLayout>
    );
}

function AlbumInfoContent({
    album,
    albumInfo,
    onLinkClick,
}: {
    album: SingleAlbum
    albumInfo?: AlbumInfoData
    onLinkClick: () => void
}) {
    const { t } = useTranslation();
    const coverArtUrl = getCoverArtUrl(album.coverArt, "album", "500");
    const genres = collectGenres(album.genre, album.genres?.map(({ name }) => name));

    return (
        <DialogLayout coverArtUrl={coverArtUrl}
            artworkAlt={album.name}
            highlighted={!!album.starred}
            hero={(
                <>
                    <Eyebrow>{t("table.columns.album", { defaultValue: "Album" })}</Eyebrow>
                    <HeroTitle>{album.name}</HeroTitle>
                    {album.artistId ? (
                        <HeroLink to={ROUTES.ARTIST.PAGE(album.artistId)} onClick={onLinkClick}>
                            {album.displayArtist ?? album.artist}
                        </HeroLink>
                    ) : (
                        <p className="text-base text-muted-foreground truncate">{album.displayArtist ?? album.artist}</p>
                    )}
                    <HeroStats>
                        {album.year ? <Stat icon={Calendar} text={`${album.year}`} /> : null}
                    </HeroStats>
                </>
            )}>
            <InfoSection title={t("songInfo.trackInfo", { defaultValue: "Details" })}>
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Hash} label={t("table.columns.id")} value={album.id} />
                    {album.playCount !== undefined && album.playCount > 0 && (
                        <InfoCard icon={PlayCircle} label={t("table.columns.plays")} value={`${album.playCount}`} />
                    )}
                    {album.created && (
                        <InfoCard icon={Calendar} label={t("table.columns.created", { defaultValue: "Created" })} value={formatDate(album.created)} />
                    )}
                </div>
            </InfoSection>

            {album.artists && album.artists.length > 0 && (
                <InfoSection title={t("table.columns.artist")}>
                    <BadgeLinks
                        items={album.artists.map(({ id, name }) => ({ id, label: name, to: ROUTES.ARTIST.PAGE(id) }))}
                        icon={Users}
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}

            {genres.length > 0 && (
                <InfoSection title={t("table.columns.genres")}>
                    <BadgeLinks
                        items={genres.map((genre) => ({ id: genre, label: genre, to: ROUTES.ALBUMS.GENRE(genre) }))}
                        icon={Tag}
                        variant="neutral"
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}

            {album.recordLabels && album.recordLabels.length > 0 && (
                <InfoSection title={t("table.columns.recordLabel")}>
                    <div className="flex flex-wrap gap-2">
                        {album.recordLabels.slice(0, RECORD_LABELS_MAX_NUMBER).map((label) => (
                            <Badge key={label.name} variant="outline">
                                {label.name}
                            </Badge>
                        ))}
                    </div>
                </InfoSection>
            )}

            {album.releaseTypes && album.releaseTypes.length > 0 && (
                <InfoSection title={t("table.columns.type", { defaultValue: "Type" })}>
                    <div className="flex flex-wrap gap-2">
                        {album.releaseTypes.map((releaseType) => (
                            <Badge key={releaseType} variant="secondary">
                                {releaseType}
                            </Badge>
                        ))}
                    </div>
                </InfoSection>
            )}

            {albumInfo?.notes && (
                <InfoSection title={t("table.columns.comment", { defaultValue: "Notes" })}>
                    <TextBlock>{albumInfo.notes}</TextBlock>
                </InfoSection>
            )}
        </DialogLayout>
    );
}

function ArtistInfoContent({
    artist,
    artistInfo,
    onLinkClick,
}: {
    artist: IArtist
    artistInfo?: ArtistInfoData
    onLinkClick: () => void
}) {
    const { t } = useTranslation();
    const coverArtUrl = artist.artistImageUrl || getCoverArtUrl(artist.coverArt, "artist", "500");
    const biography = artistInfo && typeof artistInfo === "object" && "biography" in artistInfo ? artistInfo.biography : undefined;
    const similarArtists = artistInfo && typeof artistInfo === "object" && "similarArtist" in artistInfo ? artistInfo.similarArtist : undefined;

    return (
        <DialogLayout coverArtUrl={coverArtUrl}
            artworkAlt={artist.name}
            highlighted={!!artist.starred}
            hero={(
                <>
                    <Eyebrow>{t("table.columns.artist", { defaultValue: "Artist" })}</Eyebrow>
                    <HeroTitle>{artist.name}</HeroTitle>
                    <HeroStats>
                        <Stat icon={Disc3} text={t("artist.albumCount", { count: artist.albumCount, defaultValue: `${artist.albumCount} albums` })} />
                        {artist.roles && artist.roles.length > 0 ? <Stat icon={Users} text={artist.roles.join(", ")} /> : null}
                    </HeroStats>
                </>
            )}>
            <InfoSection title={t("songInfo.trackInfo", { defaultValue: "Details" })}>
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Hash} label={t("table.columns.id")} value={artist.id} />
                    <InfoCard icon={Disc3} label={t("artist.albumCount", { defaultValue: "Albums" })} value={`${artist.albumCount}`} />
                    {artist.sortName && <InfoCard icon={Text} label={t("table.columns.sortName", { defaultValue: "Sort name" })} value={artist.sortName} />}
                    {artist.musicBrainzId && <InfoCard icon={Globe} label="MusicBrainz" value={artist.musicBrainzId} />}
                </div>
            </InfoSection>

            {artist.album && artist.album.length > 0 && (
                <InfoSection title={t("table.columns.album")}>
                    <BadgeLinks
                        items={artist.album.slice(0, 12).map((album) => ({ id: album.id, label: album.name, to: ROUTES.ALBUM.PAGE(album.id) }))}
                        icon={Disc3}
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}

            {similarArtists && similarArtists.length > 0 && (
                <InfoSection title={t("artist.relatedArtists.title", { defaultValue: "Similar artists" })}>
                    <BadgeLinks
                        items={similarArtists.slice(0, 12).map((similarArtist) => ({
                            id: similarArtist.id,
                            label: similarArtist.name,
                            to: ROUTES.ARTIST.PAGE(similarArtist.id),
                        }))}
                        icon={Users}
                        onLinkClick={onLinkClick}
                    />
                </InfoSection>
            )}

            {biography && (
                <InfoSection title={t("artist.info.title", { defaultValue: "Biography" })}>
                    <TextBlock>{biography}</TextBlock>
                </InfoSection>
            )}
        </DialogLayout>
    );
}

function PlaylistInfoContent({
    playlist,
    onLinkClick,
}: {
    playlist: PlaylistWithEntries | Playlist | InfoPlaylistItem
    onLinkClick: () => void
}) {
    const { t } = useTranslation();
    const coverArtUrl = getCoverArtUrl(playlist.coverArt, "playlist", "500");

    return (
        <DialogLayout coverArtUrl={coverArtUrl}
            artworkAlt={playlist.name}
            hero={(
                <>
                    <Eyebrow>{t("table.columns.playlist", { defaultValue: "Playlist" })}</Eyebrow>
                    <HeroTitle>{playlist.name}</HeroTitle>
                    <HeroLink to={ROUTES.PLAYLIST.PAGE(playlist.id)} onClick={onLinkClick}>
                        {playlist.owner || t("playlist.owner", { defaultValue: "Playlist" })}
                    </HeroLink>
                    <HeroStats>
                        <Badge variant={playlist.public ? "secondary" : "outline"}>
                            {playlist.public ? t("table.columns.public") : t("playlist.private", { defaultValue: "Private" })}
                        </Badge>
                    </HeroStats>
                </>
            )}>
            <InfoSection title={t("songInfo.trackInfo", { defaultValue: "Details" })}>
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Hash} label={t("table.columns.id")} value={playlist.id} />
                    {playlist.created && <InfoCard icon={Calendar} label={t("table.columns.created", { defaultValue: "Created" })} value={formatDate(playlist.created)} />}
                    {playlist.changed && <InfoCard icon={Clock} label={t("table.columns.changed", { defaultValue: "Updated" })} value={formatDate(playlist.changed)} />}
                </div>
            </InfoSection>

            {playlist.comment && (
                <InfoSection title={t("table.columns.comment")}>
                    <TextBlock>{playlist.comment}</TextBlock>
                </InfoSection>
            )}
        </DialogLayout>
    );
}

function DialogLayout({
    coverArtUrl,
    artworkAlt,
    hero,
    highlighted,
    children,
}: {
    coverArtUrl: string
    artworkAlt: string
    hero: ReactNode
    highlighted?: boolean
    children: ReactNode
}) {
    return (
        <div className="flex flex-col">
            <div className="relative">
                <div
                    className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
                    style={{ backgroundImage: `url(${coverArtUrl})` }}
                />

                <div className="relative flex gap-6 p-6 pb-4">
                    <div className="shrink-0">
                        <div className="relative group">
                            <img
                                src={coverArtUrl}
                                alt={artworkAlt}
                                className="w-40 h-40 rounded-lg shadow-2xl object-cover ring-1 ring-white/10"
                            />
                            {highlighted && (
                                <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1.5 shadow-lg">
                                    <Heart className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col justify-center min-w-0 flex-1">
                        {hero}
                    </div>
                </div>
            </div>

            <Separator />

            <ScrollArea className="max-h-[400px]">
                <div className="p-4 space-y-4">{children}</div>
            </ScrollArea>
        </div>
    );
}

function Eyebrow({ children }: { children: ReactNode }) {
    return (
        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
            {children}
        </p>
    );
}

function HeroTitle({ children }: { children: ReactNode }) {
    return (
        <h1 className="text-2xl font-bold text-foreground truncate mb-1">
            {children}
        </h1>
    );
}

function HeroLink({
    children,
    className,
    ...props
}: React.ComponentProps<typeof Link>) {
    return (
        <Link
            {...props}
            className={clsx(
                "text-base text-muted-foreground hover:text-foreground hover:underline truncate transition-colors",
                className,
            )}
        >
            {children}
        </Link>
    );
}

function HeroStats({ children }: { children: ReactNode }) {
    return <div className="flex items-center gap-4 mt-3 flex-wrap">{children}</div>;
}

function Stat({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            <span>{text}</span>
        </div>
    );
}

function ArtistsLine({
    artists,
    artist,
    artistId,
    onLinkClick,
}: {
    artists?: Array<{ id: string; name: string }>
    artist: string
    artistId?: string
    onLinkClick: () => void
}) {
    return (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <div className="flex items-center flex-wrap gap-1">
                {artists && artists.length > 0 ? (
                    artists.map(({ id, name }, index) => (
                        <Fragment key={id}>
                            <Link
                                to={ROUTES.ARTIST.PAGE(id)}
                                className="hover:text-foreground hover:underline transition-colors"
                                onClick={onLinkClick}
                            >
                                {name}
                            </Link>
                            {index < artists.length - 1 && <Dot className="mx-0" />}
                        </Fragment>
                    ))
                ) : (
                    <Link
                        to={ROUTES.ARTIST.PAGE(artistId ?? "")}
                        className={clsx(
                            "hover:text-foreground transition-colors",
                            artistId ? "hover:underline" : "pointer-events-none",
                        )}
                        onClick={() => {
                            if (artistId) onLinkClick();
                        }}
                    >
                        {artist}
                    </Link>
                )}
            </div>
        </div>
    );
}

function BadgeLinks({
    items,
    icon: Icon,
    onLinkClick,
    variant = "outline",
}: {
    items: Array<{ id: string; label: string; to: string }>
    icon: React.ComponentType<{ className?: string }>
    onLinkClick: () => void
    variant?: "outline" | "secondary" | "neutral"
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <Link key={item.id} to={item.to} onClick={onLinkClick}>
                    <Badge variant={variant} className="hover:bg-accent transition-colors cursor-pointer">
                        <Icon className="w-3 h-3 mr-1" />
                        {item.label}
                    </Badge>
                </Link>
            ))}
        </div>
    );
}

function TextBlock({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-lg bg-muted/50 p-3 text-sm leading-6 text-foreground/90">
            {children}
        </div>
    );
}

function collectGenres(primary?: string, list?: Array<string | undefined>) {
    const genres = new Set<string>();

    if (primary) {
        genres.add(primary);
    }

    list?.forEach((genre) => {
        if (genre) {
            genres.add(genre);
        }
    });

    return [...genres];
}

function formatDate(value?: string) {
    if (!value) return "-";
    return dateTime(value).format("LLL");
}

function getDialogState({
    targetType,
    targetItem,
    songQuery,
    albumQuery,
    albumInfoQuery,
    artistQuery,
    artistInfoQuery,
    playlistQuery,
}: {
    targetType?: InfoItemType
    targetItem?: InfoItemData
    songQuery: ReturnType<typeof useQuery<ISong | undefined>>
    albumQuery: ReturnType<typeof useQuery<SingleAlbum | undefined>>
    albumInfoQuery: ReturnType<typeof useQuery<AlbumInfoData | undefined>>
    artistQuery: ReturnType<typeof useQuery<IArtist | undefined>>
    artistInfoQuery: ReturnType<typeof useQuery<ArtistInfoData | undefined>>
    playlistQuery: ReturnType<typeof useQuery<PlaylistWithEntries | undefined>>
}) {
    switch (targetType) {
        case "song":
            return {
                isLoading: !targetItem && songQuery.isLoading,
                hasData: !!(songQuery.data ?? targetItem),
                type: "song" as const,
                song: (songQuery.data ?? targetItem) as ISong | undefined,
            };
        case "album":
            return {
                isLoading: (!targetItem && albumQuery.isLoading) || albumInfoQuery.isLoading,
                hasData: !!(albumQuery.data ?? targetItem),
                type: "album" as const,
                album: (albumQuery.data ?? targetItem) as SingleAlbum | Albums | undefined,
                albumInfo: albumInfoQuery.data,
            };
        case "artist":
            return {
                isLoading: (!targetItem && artistQuery.isLoading) || artistInfoQuery.isLoading,
                hasData: !!(artistQuery.data ?? targetItem),
                type: "artist" as const,
                artist: (artistQuery.data ?? targetItem) as IArtist | undefined,
                artistInfo: artistInfoQuery.data,
            };
        case "playlist":
            return {
                isLoading: !targetItem && playlistQuery.isLoading,
                hasData: !!(playlistQuery.data ?? targetItem),
                type: "playlist" as const,
                playlist: (playlistQuery.data ?? targetItem) as PlaylistWithEntries | Playlist | InfoPlaylistItem | undefined,
            };
        default:
            return {
                isLoading: false,
                hasData: false,
                type: null,
            };
    }
}

interface InfoSectionProps {
    title: string
    children: React.ReactNode
}

function InfoSection({ title, children }: InfoSectionProps) {
    return (
        <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
            </h3>
            {children}
        </div>
    );
}

interface InfoCardProps {
    icon?: React.ComponentType<{ className?: string }>
    label: string
    value: string
}

function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
            {Icon && (
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}
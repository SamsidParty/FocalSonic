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
import { useSongInfo } from "@/store/ui.store";
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
    FileAudio,
    Gauge,
    HardDrive,
    Hash,
    Heart,
    Loader2,
    Music2,
    PlayCircle,
    Radio,
    Tag,
    User,
    Users,
    Volume2
} from "lucide-react";
import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function SongInfoDialog() {
    const { t } = useTranslation();
    const { songId, modalOpen, reset } = useSongInfo();
    const { isAppleMusic } = checkServerType();

    const { data: song, isLoading } = useQuery({
        queryKey: [queryKeys.song.info, songId],
        queryFn: () => service.songs.getSong(songId),
        enabled: modalOpen,
    });

    const loadedAlbumId = song ? typeof song.albumId === "string" : false;

    const { data: album, isLoading: albumLoading } = useQuery({
        queryKey: [queryKeys.album.single, song?.albumId],
        queryFn: () => service.albums.getOne(song?.albumId ?? ""),
        enabled: loadedAlbumId,
    });

    function handleModalChange(value: boolean) {
        if (!value) reset();
    }

    function handleLinkClick() {
        reset();
    }

    function formatGenres() {
        if (!song) return [];
        const genres: string[] = [];

        if (song.genre) {
            genres.push(song.genre);
        }

        if (song.genres) {
            song.genres.forEach(({ name }) => {
                if (genres.includes(name)) return;

                genres.push(name);
            });
        }

        return genres;
    }

    function formatLastPlayed() {
        if (!song) return "";

        const lastPlayed = dateTime().from(dateTime(song.played), true);

        return t("table.lastPlayed", { date: lastPlayed });
    }

    const coverArtUrl = song ? getCoverArtUrl(song.coverArt, "song", "500") : "";

    return (
        <Dialog open={modalOpen} onOpenChange={handleModalChange}>
            <DialogContent
                className="max-w-[700px] p-0 gap-0 overflow-hidden"
                aria-describedby={undefined}
            >
                {(isLoading) && (
                    <div className="flex w-full h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {!song && !isLoading && (
                    <div className="flex w-full h-64 items-center justify-center">
                        <p className="text-muted-foreground">{t("songInfo.error")}</p>
                    </div>
                )}

                {song && !isLoading && (
                    <div className="flex flex-col">
                        {/* Hero Section with Artwork */}
                        <div className="relative">
                            {/* Blurred Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
                                style={{ backgroundImage: `url(${coverArtUrl})` }}
                            />

                            {/* Content */}
                            <div className="relative flex gap-6 p-6 pb-4">
                                {/* Album Artwork */}
                                <div className="shrink-0">
                                    <div className="relative group">
                                        <img
                                            src={coverArtUrl}
                                            alt={song.album}
                                            className="w-40 h-40 rounded-lg shadow-2xl object-cover ring-1 ring-white/10"
                                        />
                                        {song.starred && (
                                            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-1.5 shadow-lg">
                                                <Heart className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title & Quick Info */}
                                <div className="flex flex-col justify-center min-w-0 flex-1">
                                    <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                                        {t("songInfo.title")}
                                    </p>
                                    <h1 className="text-2xl font-bold text-foreground truncate mb-1">
                                        {song.title}
                                    </h1>
                                    <Link
                                        to={ROUTES.ALBUM.PAGE(song.albumId)}
                                        className="text-base text-muted-foreground hover:text-foreground hover:underline truncate transition-colors"
                                        onClick={handleLinkClick}
                                    >
                                        {song.album}
                                    </Link>

                                    {/* Artist(s) */}
                                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                                        <User className="w-3.5 h-3.5" />
                                        <div className="flex items-center flex-wrap gap-1">
                                            {song.artists ? (
                                                song.artists.map(({ id, name }, index) => (
                                                    <Fragment key={id}>
                                                        <Link
                                                            to={ROUTES.ARTIST.PAGE(id)}
                                                            className="hover:text-foreground hover:underline transition-colors"
                                                            onClick={handleLinkClick}
                                                        >
                                                            {name}
                                                        </Link>
                                                        {index < song.artists!.length - 1 && (
                                                            <Dot className="mx-0" />
                                                        )}
                                                    </Fragment>
                                                ))
                                            ) : (
                                                <Link
                                                    to={ROUTES.ARTIST.PAGE(song.artistId ?? "")}
                                                    className={clsx(
                                                        "hover:text-foreground transition-colors",
                                                        song.artistId ? "hover:underline" : "pointer-events-none",
                                                    )}
                                                    onClick={() => {
                                                        if (song.artistId) handleLinkClick();
                                                    }}
                                                >
                                                    {song.artist}
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{convertSecondsToTime(song.duration ?? 0)}</span>
                                        </div>
                                        {song.year > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{song.year}</span>
                                            </div>
                                        )}
                                        {!isAppleMusic && song.suffix && (
                                            <Badge variant="secondary" className="text-xs px-2 py-0">
                                                {song.suffix.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Details Section */}
                        <ScrollArea className="max-h-[400px]">
                            <div className="p-4 space-y-4">
                                {/* Track Information */}
                                <InfoSection title={t("songInfo.trackInfo")}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <InfoCard
                                            icon={Hash}
                                            label={t("table.columns.id")}
                                            value={`${song.id ?? "-"}`}
                                        />
                                        {song.playCount !== undefined && song.playCount > 0 && (
                                            <InfoCard
                                                icon={PlayCircle}
                                                label={t("table.columns.plays")}
                                                value={`${song.playCount}`}
                                            />
                                        )}
                                        {!isAppleMusic && song.played && (
                                            <InfoCard
                                                icon={Clock}
                                                label={t("table.columns.lastPlayed")}
                                                value={formatLastPlayed()}
                                            />
                                        )}
                                    </div>
                                </InfoSection>

                                {/* Album Artists */}
                                {song.albumArtists && song.albumArtists.length > 0 && (
                                    <InfoSection title={t("table.columns.albumArtist")}>
                                        <div className="flex flex-wrap gap-2">
                                            {song.albumArtists.map(({ id, name }) => (
                                                <Link
                                                    key={id}
                                                    to={ROUTES.ARTIST.PAGE(id)}
                                                    onClick={handleLinkClick}
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className="hover:bg-accent transition-colors cursor-pointer"
                                                    >
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {name}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    </InfoSection>
                                )}

                                {/* Contributors */}
                                {song.contributors && song.contributors.length > 1 && (
                                    <InfoSection title={t("table.columns.contributors")}>
                                        <div className="grid gap-2">
                                            {song.contributors.map((contributor, index) => (
                                                <div
                                                    key={contributor.artist.name + index}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <Badge variant="secondary" className="capitalize text-xs">
                                                        {contributor.role}
                                                    </Badge>
                                                    <span className="text-foreground">
                                                        {contributor.artist.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </InfoSection>
                                )}

                                {/* Genres */}
                                {formatGenres().length > 0 && (
                                    <InfoSection title={t("table.columns.genres")}>
                                        <div className="flex flex-wrap gap-2">
                                            {formatGenres().map((genre) => (
                                                <Link
                                                    to={ROUTES.ALBUMS.GENRE(genre)}
                                                    key={genre}
                                                    onClick={handleLinkClick}
                                                >
                                                    <Badge
                                                        variant="neutral"
                                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                                    >
                                                        <Tag className="w-3 h-3 mr-1" />
                                                        {genre}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    </InfoSection>
                                )}

                                {/* Record Labels */}
                                {album && !albumLoading && album.recordLabels && album.recordLabels.length > 0 && (
                                    <InfoSection title={t("table.columns.recordLabel")}>
                                        <div className="flex flex-wrap gap-2">
                                            {album.recordLabels
                                                .slice(0, RECORD_LABELS_MAX_NUMBER)
                                                .map((label) => (
                                                    <Badge key={label.name} variant="outline">
                                                        {label.name}
                                                    </Badge>
                                                ))}
                                        </div>
                                    </InfoSection>
                                )}

                                {/* Audio Quality */}
                                {!isAppleMusic && (
                                    <InfoSection title={t("songInfo.audioQuality")}>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <InfoCard
                                                icon={FileAudio}
                                                label={t("table.columns.codec")}
                                                value={song.suffix?.toUpperCase() ?? "-"}
                                            />
                                            <InfoCard
                                                icon={Radio}
                                                label={t("table.columns.bitrate")}
                                                value={`${song.bitRate ?? 0} kbps`}
                                            />
                                            <InfoCard
                                                icon={HardDrive}
                                                label={t("table.columns.size")}
                                                value={formatBytes(song.size ?? 0)}
                                            />
                                            {song.samplingRate !== undefined && song.samplingRate > 0 && (
                                                <InfoCard
                                                    icon={Gauge}
                                                    label={t("table.columns.samplingRate")}
                                                    value={`${(song.samplingRate / 1000).toFixed(1)} kHz`}
                                                />
                                            )}
                                            {song.channelCount !== undefined && song.channelCount > 0 && (
                                                <InfoCard
                                                    icon={Volume2}
                                                    label={t("table.columns.channelCount")}
                                                    value={song.channelCount === 2 ? "Stereo" : song.channelCount === 1 ? "Mono" : `${song.channelCount} ch`}
                                                />
                                            )}
                                            {song.bpm !== undefined && song.bpm > 0 && (
                                                <InfoCard
                                                    icon={Music2}
                                                    label={t("table.columns.bpm")}
                                                    value={`${song.bpm}`}
                                                />
                                            )}
                                        </div>
                                    </InfoSection>
                                )}

                                {/* Replay Gain */}
                                {song.replayGain && (
                                    <InfoSection title={t("songInfo.replayGain")}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InfoCard
                                                label={t("table.columns.trackGain")}
                                                value={`${song.replayGain.trackGain?.toFixed(2) ?? 0} dB`}
                                            />
                                            <InfoCard
                                                label={t("table.columns.trackPeak")}
                                                value={`${song.replayGain.trackPeak?.toFixed(4) ?? 1}`}
                                            />
                                            <InfoCard
                                                label={t("table.columns.albumGain")}
                                                value={`${song.replayGain.albumGain?.toFixed(2) ?? 0} dB`}
                                            />
                                            <InfoCard
                                                label={t("table.columns.albumPeak")}
                                                value={`${song.replayGain.albumPeak?.toFixed(4) ?? 1}`}
                                            />
                                        </div>
                                    </InfoSection>
                                )}

                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
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

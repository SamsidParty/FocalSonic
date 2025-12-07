import LastFmIcon from "@/app/components/icons/last-fm";
import MusicbrainzIcon from "@/app/components/icons/musicbrainz";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { Skeleton } from "@/app/components/ui/skeleton";
import { fetchLastFmArtistInfo } from "@/utils/lastFm";
import { sanitizeLinks } from "@/utils/parseTexts";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface InfoPanelProps {
    title: string
    bio?: string
    lastFmUrl?: string
    musicBrainzId?: string
    autoPullFromLastFm?: "none" | "artist";
}

const containerClasses =
  "flex flex-col items-start gap-1 rounded border p-5 text-left text-sm transition-all bg-background-foreground";

export default function InfoPanel({
    title,
    bio,
    lastFmUrl,
    musicBrainzId,
    autoPullFromLastFm
}: InfoPanelProps) {
    const { t } = useTranslation();
    const [resolvedBio, setResolvedBio] = useState<string | undefined>(bio);

    useEffect(() => {
        const fetchLastFmBio = async (artistName: string) => {
            const artistData = await fetchLastFmArtistInfo(artistName);
            return artistData?.bio?.summary || "";
        };

        if (autoPullFromLastFm === "artist" && !bio && title) {
            fetchLastFmBio(title).then((fetchedBio) => {
                setResolvedBio(fetchedBio);
            });
        }
    }, [bio, autoPullFromLastFm, title]);

    if (!resolvedBio) return null;

    return (
        <div className={containerClasses} id="artist-biography">
            <h3 className="scroll-m-20 mb-2 text-2xl font-semibold tracking-tight">
                {t("album.info.about", { name: title })}
            </h3>
            <p
                className="html leading-6 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeLinks(resolvedBio) }}
            />

            <div className="flex w-full mt-2 gap-2">
                {lastFmUrl && (
                    <SimpleTooltip text={t("album.info.lastfm")}>
                        <a
                            target="_blank"
                            rel="nofollow noreferrer"
                            href={lastFmUrl}
                            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
                        >
                            <LastFmIcon className="w-6 h-6 fill-foreground" />
                        </a>
                    </SimpleTooltip>
                )}

                {musicBrainzId && (
                    <SimpleTooltip text={t("album.info.musicbrainz")}>
                        <a
                            target="_blank"
                            rel="nofollow noreferrer"
                            href={`https://musicbrainz.org/artist/${musicBrainzId}`}
                            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
                        >
                            <MusicbrainzIcon className="w-6 h-6 fill-foreground" />
                        </a>
                    </SimpleTooltip>
                )}
            </div>
        </div>
    );
}

export function InfoPanelFallback() {
    return (
        <div className={containerClasses}>
            <Skeleton className="h-9 w-[300px] mb-2 rounded bg-border" />
            <Skeleton className="h-3 w-full rounded bg-border" />
            <Skeleton className="h-3 w-full rounded bg-border" />
            <Skeleton className="h-3 w-1/2 rounded bg-border" />

            <div className="flex w-full mt-2 gap-2">
                <Skeleton className="w-10 h-10 rounded-full bg-border" />
            </div>
        </div>
    );
}

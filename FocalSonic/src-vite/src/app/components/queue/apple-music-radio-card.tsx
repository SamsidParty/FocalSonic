import { getCoverArtUrl } from "@/api/httpClient";
import { Card, CardContent } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/player.store";
import { AppleMusicStation, AppleMusicStationDisplay } from "@/types/applemusic/common";
import { checkServerType } from "@/utils/servers";
import { Radio } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Separator } from "../ui/separator";

type AppleMusicRadioCardProps = {
    compact?: boolean
    className?: string
};

function resolveRadioStation(
    currentRadioStation: AppleMusicStationDisplay | null,
    currentSong: any,
) {
    const songStationData = currentSong?.appleMusic?.data?.relationships?.station?.data;
    const songStation = (Array.isArray(songStationData)
        ? songStationData[0]
        : songStationData) as AppleMusicStation | undefined;

    const stationName = currentRadioStation?.name || songStation?.attributes?.name;

    if (!stationName) {
        return null;
    }

    return {
        id: currentRadioStation?.id || songStation?.id || "",
        name: stationName,
        coverArt: currentRadioStation?.coverArt || songStation?.attributes?.artwork?.url,
    };
}

export function AppleMusicRadioCard({ compact = false, className }: AppleMusicRadioCardProps) {
    const { t } = useTranslation();
    const { isAppleMusic } = checkServerType();
    const { currentRadioID, currentRadioStation, currentSong } = usePlayerStore(({ songlist }) => ({
        currentRadioID: songlist.currentRadioID,
        currentRadioStation: songlist.currentRadioStation,
        currentSong: songlist.currentSong,
    }));

    const station = useMemo(
        () => resolveRadioStation(currentRadioStation, currentSong),
        [currentRadioStation, currentSong],
    );

    if (!isAppleMusic || !currentRadioID || !station) {
        return null;
    }

    const artworkUrl = station.coverArt
        ? getCoverArtUrl(station.coverArt, "album", compact ? "200" : "300")
        : null;

    return (
        <>
            <Card className={cn("shadow-none bg-transparent border-none", className)}>
                <CardContent className={cn("flex items-center gap-3", compact ? "p-2" : "p-3")}>
                    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-sm", compact ? "h-16 w-16" : "h-20 w-20")}>
                        {artworkUrl ? (
                            <LazyLoadImage
                                src={artworkUrl}
                                alt={station.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <Radio className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={cn("truncate font-semibold text-foreground", compact ? "text-sm" : "text-sm")}>
                            <Radio className="mr-1 mb-1 inline h-4 w-4 text-foreground" />
                            {t("queue.playingFromStation", { station: "" })}
                        </p>
                        <p className={cn("truncate text-muted-foreground", compact ? "text-xs" : "text-sm")}>{station.name}</p>
                    </div>
                </CardContent>
            </Card>
            <Separator />
        </>
    );
}
import { getCoverArtUrl } from "@/api/httpClient";
import { Radio } from "@/types/responses/radios";
import { Radio as RadioIcon } from "lucide-react";
import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { LazyLoadImage } from "react-lazy-load-image-component";

export function RadioInfo({ radio }: { radio: Radio | undefined }) {
    const { t } = useTranslation();

    return (
        <Fragment>
            {
                radio.coverArt ? (
                    <div className="min-h-[calc(var(--player-height)-1.5rem)] max-h-[calc(var(--player-height)-1.5rem)] aspect-square bg-cover bg-center bg-skeleton rounded overflow-hidden shadow-md">
                        <LazyLoadImage
                            key={radio.id}
                            id="track-song-image"
                            src={getCoverArtUrl(radio.coverArt, "song", "400")}
                            width="100%"
                            height="100%"
                            crossOrigin="anonymous"
                            className="aspect-square object-cover w-full h-full cursor-pointer bg-skeleton text-transparent"
                            data-testid="track-image"
                        />
                    </div>
                ) : (
                    <div className="min-h-[calc(var(--player-height)-1.5rem)] max-h-[calc(var(--player-height)-1.5rem)] aspect-square flex justify-center items-center bg-muted rounded">
                        <RadioIcon data-testid="song-no-playing-icon" />
                    </div>
                )
            }

            <div className="flex flex-col justify-center">
                {radio ? (
                    <Fragment>
                        <span className="text-sm font-medium" data-testid="radio-name">
                            {radio.name}
                        </span>
                        <span
                            className="text-xs font-light text-muted-foreground"
                            data-testid="radio-label"
                        >
                            {t("radios.label")}
                        </span>
                    </Fragment>
                ) : (
                    <span className="text-sm font-medium" data-testid="radio-no-playing">
                        {t("player.noRadioPlaying")}
                    </span>
                )}
            </div>
        </Fragment>
    );
}

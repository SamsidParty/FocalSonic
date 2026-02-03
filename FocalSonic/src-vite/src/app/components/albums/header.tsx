import { ShadowHeader } from "@/app/components/album/shadow-header";
import { HeaderTitle } from "@/app/components/header-title";
import { ListDisplayMode } from "@/types/listDisplayMode";
import { AlbumsSearchParams } from "@/utils/albumsFilter";
import { SearchParamsHandler } from "@/utils/searchParamsHandler";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import ListDisplayModePicker from "../list-mode-picker";
import { AlbumsFilter } from "./filters";

interface AlbumsHeaderProps {
    albumCount: number,
    setDisplayMode?: (mode: ListDisplayMode) => void,
    displayMode?: ListDisplayMode,
}

export function AlbumsHeader({ albumCount, displayMode, setDisplayMode }: AlbumsHeaderProps) {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { getSearchParam } = new SearchParamsHandler(searchParams);

    const artistName = getSearchParam<string>(AlbumsSearchParams.ArtistName, "");

    const defaultLabel = t("sidebar.albums");
    const discographyLabel = t("album.list.header.albumsByArtist", {
        artist: artistName,
    });
    const label = artistName === "" ? defaultLabel : discographyLabel;

    return (
        <ShadowHeader>
            <div className="w-full flex justify-between gap-2">
                <HeaderTitle title={label} count={albumCount} />
                <ListDisplayModePicker className="ml-auto" displayMode={displayMode} setDisplayMode={setDisplayMode} />
                <AlbumsFilter />
            </div>
        </ShadowHeader>
    );
}

import { ExpandableSearchInput } from "@/app/components/search/expandable-input";
import { AlbumListType } from "@/types/responses/album";
import { AlbumsFilters, AlbumsSearchParams } from "@/utils/albumsFilter";
import { SearchParamsHandler } from "@/utils/searchParamsHandler";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { AlbumsFilterByGenre } from "./filters/by-genre";
import { AlbumsFilterByYear } from "./filters/by-year";
import { AlbumsMainFilter } from "./filters/main";

export function AlbumsFilter() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const { getSearchParam } = new SearchParamsHandler(searchParams);

    const currentFilter = getSearchParam<AlbumListType>(
        AlbumsSearchParams.MainFilter,
        AlbumsFilters.ByName,
    );

    return (
        <div className="flex gap-2">
            {currentFilter === AlbumsFilters.ByYear && <AlbumsFilterByYear />}

            {currentFilter === AlbumsFilters.ByGenre && <AlbumsFilterByGenre />}

            <AlbumsMainFilter />

            <ExpandableSearchInput placeholder={t("album.list.search.placeholder")} />
        </div>
    );
}

import { ROUTES } from "@/routes/routesList";
import { service } from "@/service/service";
import { usePlayerActions } from "@/store/player.store";
import { AppleMusicRecommendationContent } from "@/types/applemusic/recommendations";
import { Albums } from "@/types/responses/album";
import { checkServerType } from "@/utils/servers";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function usePreviewCard() {

    const { setSongList, setPlayAppleMusicRadio } = usePlayerActions();
    const { t } = useTranslation();
    const { isAppleMusic } = checkServerType();
    const navigate = useNavigate();
    const { setPlayRadio } = usePlayerActions();

    async function handlePlay(entry: AppleMusicRecommendationContent | Albums) {


        if (entry.type === "stations") {
            // Apple music radio
            setPlayAppleMusicRadio(entry);
            return;
        }
        else if (entry.type?.includes("playlist") && entry.id) {
            const response = await service.playlists.getOne(entry.id);

            if (response) {
                setSongList(response.entry, 0);
                return;
            }
        }
        else {
            const response = await service.albums.getOne(entry.id);

            if (response) {
                setSongList(response.song, 0);
                return;
            }
        }



        navigateToResource(entry);
    }

    const getResourceType = (entry: AppleMusicRecommendationContent | Albums) => {
        const type = (entry as AppleMusicRecommendationContent).type;
        return type?.slice(0, -1).toUpperCase().replace("LIBRARY-", "") || "ALBUM";
    };

    const navigateToResource = (entry: AppleMusicRecommendationContent | Albums) => {

        if (entry?.attributes?.link?.target == "external" && entry?.attributes?.link?.url) {
            window.open(entry?.attributes.link.url);
            return;
        }

        if (entry.type === "stations") {
            handlePlay(entry); 
            return;
        }

        let resourceType = getResourceType(entry);
        resourceType == "SONG" && (resourceType = "ALBUM");

        const route = ROUTES[resourceType]?.PAGE(entry.id);

        if (route) {
            setTimeout(() => navigate(route), 0);
        }
    };


    return {
        navigateToResource,
        handlePlay,
        getResourceType
    };

}
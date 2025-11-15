import PreviewList from "@/app/components/home/preview-list";
import {
    useGetAppleMusicHome
} from "@/app/hooks/use-home";
import { useTranslation } from "react-i18next";
import { PreviewListFallback } from "../components/fallbacks/home-fallbacks";

export default function AppleMusicHome() {
    const { t } = useTranslation();

    const { data, isLoading, isFetching } = useGetAppleMusicHome();
    const hideSections = ["replay", "recently played"];
    const sections = data?.data.filter((s) => !hideSections.some(h => s.attributes?.title?.stringForDisplay.toLowerCase().includes(h))) || [];

    return (
        <div className="w-full px-8 py-6">

            {
                isLoading ? [...Array(4)].map((_, index) => (
                    <PreviewListFallback key={index} />
                )) : null
            }

            {sections.map((section, i) => {
                return (
                    <PreviewList
                        key={section.id}
                        title={section.attributes.title?.stringForDisplay}
                        showMore={false}
                        isLarge={i === 0}
                        list={section.relationships.contents.data}
                    />
                );
            })}
        </div>
    );
}

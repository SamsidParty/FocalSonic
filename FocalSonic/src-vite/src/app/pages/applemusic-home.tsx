import PreviewList from "@/app/components/home/preview-list";
import {
    useGetAppleMusicHome
} from "@/app/hooks/use-home";
import { useTranslation } from "react-i18next";
import { PreviewListFallback } from "../components/fallbacks/home-fallbacks";

export default function AppleMusicHome() {
    const { t } = useTranslation();

    const { data, isLoading, isFetching } = useGetAppleMusicHome();
    const sections = data?.data || [];

    return (
        <div className="w-full px-8 py-6">

            {
                isLoading ? [...Array(4)].map((_, index) => (
                    <PreviewListFallback key={index} />
                )) : null
            }

            {sections.map((section) => {
                return (
                    <PreviewList
                        key={section.id}
                        title={section.attributes.title.stringForDisplay}
                        showMore={false}
                        list={section.relationships.contents.data}
                    />
                );
            })}
        </div>
    );
}

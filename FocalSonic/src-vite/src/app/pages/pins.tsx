import { t } from "i18next";
import React from "react";
import { PreviewListFallback } from "../components/fallbacks/home-fallbacks";
import PreviewList from "../components/home/preview-list";
import { useGetAppleMusicHome, useGetAppleMusicPins } from "../hooks/use-home";

export default function PinsPage() {

    const { data, isLoading, isFetching } = useGetAppleMusicPins();
    const sections = data?.data || [];

    const { data: homeData, isLoading: homeLoading, isFetching: homeFetching } = useGetAppleMusicHome();
    const allowedHomeSections = ["replay", "recently played"];
    const homeSections = homeData?.data.filter((s) => allowedHomeSections.filter((a) => s.attributes?.title?.stringForDisplay.toLowerCase().includes(a)).length > 0) || [];

    return (
        <div className="w-full px-8 py-6">

            {
                isLoading ? [...Array(4)].map((_, index) => (
                    <PreviewListFallback key={index} />
                )) : null
            }

            {
                sections.length > 0 && (
                    <PreviewList
                        key={"pinned-section"}
                        title={t("playlist.pinned")}
                        showMore={false}
                        isLarge={true}
                        list={sections}
                    />
                )
            }


            
            {homeSections.map((section, i) => {
                return (
                    <PreviewList
                        key={section.id}
                        title={section.attributes.title?.stringForDisplay}
                        showMore={false}
                        isLarge={false}
                        list={section.relationships.contents.data}
                    />
                );
            })}

        </div>
    );
}
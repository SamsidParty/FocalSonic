import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useAppStore } from "@/store/app.store";
import { usePlayerStyle } from "@/store/theme.store";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import clsx from "clsx";
import React, { useEffect, useRef } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";


export function MainRoutes() {
    const { pathname } = useLocation() as Location;
    const { sidebarOpen } = useAppStore().settings;
    const { isPlayerAtTop } = usePlayerStyle();
    const animationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollPageToTop();

        if (animationRef?.current) {
            animationRef.current.style.animation = "mainPageAnimation 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        }
    }, [pathname]);

    return (
        <main className={
            clsx(
                "flex h-full transition-[padding-left,transform] duration-500 ease-long",
                sidebarOpen ? "pl-sidebar" : "pl-mini-sidebar",
                isPlayerAtTop ? "pt-[calc(var(--player-height)+var(--header-height))]" : "pb-player pt-header"
            )
        }
        >
            <div className="absolute inset-0 bg-bar " />
            <div className="relative overflow-hidden flex h-full w-full rounded-md mr-3">
                <ScrollArea
                    id="main-scroll-area"
                    className="w-full bg-body main-page"
                    ref={animationRef}
                    onAnimationEnd={(event: React.AnimationEvent<HTMLDivElement>) => event.currentTarget.style.animation = ""}
                >
                    <Outlet />
                </ScrollArea>
            </div>
        </main>
    );
}

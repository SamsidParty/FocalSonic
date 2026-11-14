import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useAppStore } from "@/store/app.store";
import { usePlayerStyle } from "@/store/theme.store";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import clsx from "clsx";
import React, { useEffect, useRef } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";


export function MainRoutes() {
    const { pathname } = useLocation() as Location;
    const { sidebarOpen, extraBarContent } = useAppStore().settings;
    const { isPlayerAtTop, playerStyle } = usePlayerStyle();
    const mainRef = useRef<HTMLElement>(null);
    const animationRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        scrollPageToTop();
        const animationFrame = requestAnimationFrame(() => {
            mainRef.current?.focus({ preventScroll: true });
        });

        if (animationRef?.current) {
            animationRef.current.style.animation = "mainPageAnimation 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [pathname]);

    return (
        <main
            ref={mainRef}
            className={
                clsx(
                    "flex h-full transition-[padding-left,transform,padding-right] duration-500 ease-long focus:outline-none",
                    sidebarOpen ? "pl-sidebar" : "pl-mini-sidebar",
                    (extraBarContent != "none") ? "pr-sidebar" : "pr-0",
                    isPlayerAtTop ? "pt-[calc(var(--player-height)+var(--header-height))]" : "pb-player pt-header"
                )
            }
            tabIndex={-1}
        >
            {/*
                The bar backdrop and the page share one compositing layer (transform-gpu), like the
                fixed sidebar and extrabar. Painted into WebKit's root layer instead, these
                translucent colours flicker on macOS.
            */}
            <div className="flex h-full w-full bg-bar transform-gpu">
                <div className="relative overflow-hidden flex h-full w-full rounded-md mr-3 app-inner">
                    <ScrollArea
                        id="main-scroll-area"
                        className={clsx(
                            "w-full bg-body main-page",
                            (playerStyle === "floating" && !isPlayerAtTop) && "pb-[90px]",
                        )}
                        ref={animationRef}
                        onAnimationEnd={(event: React.AnimationEvent<HTMLDivElement>) => {
                            // animationend bubbles up from the page's own animations; only clear the page-in one.
                            if (event.target === event.currentTarget) event.currentTarget.style.animation = "";
                        }}
                    >
                        <Outlet />
                    </ScrollArea>
                </div>
            </div>
        </main>
    );
}

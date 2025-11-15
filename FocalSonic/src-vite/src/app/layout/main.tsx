import { ScrollArea } from "@/app/components/ui/scroll-area";
import { usePlayerStyle } from "@/store/theme.store";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import clsx from "clsx";
import React, { useEffect } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";
import { useAppWindow } from "../hooks/use-app-window";


export function MainRoutes() {
    const { pathname } = useLocation() as Location;
    const { isSidebarOpen } = useAppWindow();
    const { isPlayerAtTop } = usePlayerStyle();

    useEffect(() => {
        scrollPageToTop();
    }, [pathname]);

    return (
        <main className={
            clsx(
                "flex h-full transition-[padding-left] duration-500 ease-long",
                isSidebarOpen ? "pl-sidebar" : "pl-mini-sidebar",
                isPlayerAtTop ? "pt-[calc(var(--player-height)+var(--header-height))]" : "pb-player pt-header"
            )
        }
        >
            <div className="bg-bar relative overflow-hidden flex h-full w-full pr-3">
                <ScrollArea
                    id="main-scroll-area"
                    className="w-full bg-body rounded-md"
                >
                    <Outlet />
                </ScrollArea>
            </div>
        </main>
    );
}

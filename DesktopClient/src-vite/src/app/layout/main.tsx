import { ScrollArea } from "@/app/components/ui/scroll-area";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import clsx from "clsx";
import { useEffect } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";
import { useAppWindow } from "../hooks/use-app-window";

export function MainRoutes() {
    const { pathname } = useLocation() as Location;
    const { isSidebarOpen } = useAppWindow();

    useEffect(() => {
        scrollPageToTop();
    }, [pathname]);

    return (
        <main className={
            clsx(
                "flex h-full pt-header pb-player transition-[padding-left] duration-500 ease-long",
                isSidebarOpen ? "pl-sidebar" : "pl-mini-sidebar"
            )
        }
        >
            <ScrollArea
                id="main-scroll-area"
                className="w-full bg-background-foreground"
            >
                <Outlet />
            </ScrollArea>
        </main>
    );
}

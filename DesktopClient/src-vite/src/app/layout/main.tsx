import { ScrollArea } from "@/app/components/ui/scroll-area";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import clsx from "clsx";
import { useEffect } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";

export function MainRoutes({ sidebarOpen }: { sidebarOpen: boolean }) {
    const { pathname } = useLocation() as Location;

    useEffect(() => {
        scrollPageToTop();
    }, [pathname]);

    return (
        <main className={
            clsx(
                "flex h-full pt-header pb-player transition-[padding-left] duration-500 ease-long",
                sidebarOpen ? "pl-sidebar" : "pl-mini-sidebar"
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

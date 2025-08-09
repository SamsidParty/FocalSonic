import { ScrollArea } from "@/app/components/ui/scroll-area";
import { scrollPageToTop } from "@/utils/scrollPageToTop";
import { useEffect } from "react";
import { Location, Outlet, useLocation } from "react-router-dom";

export function MainRoutes() {
    const { pathname } = useLocation() as Location;

    useEffect(() => {
        scrollPageToTop();
    }, [pathname]);

    return (
        <main className="flex h-full pl-sidebar pt-header pb-player">
            <ScrollArea
                id="main-scroll-area"
                className="w-full bg-background-foreground"
            >
                <Outlet />
            </ScrollArea>
        </main>
    );
}

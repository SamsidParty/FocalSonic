import { MenuIcon } from "lucide-react";
import { Button } from "../ui/button";

export function SidebarMenuButton({ setSidebarOpen, sidebarOpen }: { setSidebarOpen: (open: boolean) => void, sidebarOpen: boolean }) {
    return (
        <Button
            variant={"ghost"}
            className="w-0 h-fit aspect-square flex flex-col justify-center items-center gap-1"
            onClick={() => setSidebarOpen(!sidebarOpen)}
        >
            <MenuIcon className="w-4 h-4" />
        </Button>
    )
}
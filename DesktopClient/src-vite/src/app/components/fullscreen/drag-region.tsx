import { cn } from "@/lib/utils";
import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion";
import { ComponentPropsWithoutRef } from "react";

type DragRegionProps = ComponentPropsWithoutRef<"div">

export function DragRegion({ className, ...props }: DragRegionProps) {
    return (
        <div
            className={cn("fixed top-0 inset-x-0 h-header cursor-move", className)}
            {...igniteViewDragRegion}
            {...props}
        >
            <div className="fixed h-6 w-[70px] left-[8px] top-[10px] cursor-default" />
        </div>
    );
}

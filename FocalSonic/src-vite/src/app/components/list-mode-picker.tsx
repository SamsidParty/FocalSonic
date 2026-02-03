import { Button } from "@/app/components/ui/button";
import { SimpleTooltip } from "@/app/components/ui/simple-tooltip";
import { ListDisplayMode } from "@/types/listDisplayMode";
import { Grid as GridIcon, List as ListIcon, SquareDashedBottomCodeIcon } from "lucide-react";
import React from "react";

interface ListDisplayPickerProps {
    setDisplayMode?: (mode: ListDisplayMode) => void;
    displayMode?: ListDisplayMode;
    className?: string;
}

export default function ListDisplayModePicker({ displayMode = "grid", setDisplayMode, className }: ListDisplayPickerProps) {
    const items: { key: ListDisplayMode; title: string; icon: JSX.Element }[] = [
        { key: "grid", title: "Grid", icon: <GridIcon className="min-w-4 min-h-4 h-4 w-4" /> },
        { key: "list", title: "List", icon: <ListIcon className="min-w-4 min-h-4 h-4 w-4" /> },
        { key: "3dshelf", title: "Shelf", icon: <SquareDashedBottomCodeIcon className="min-w-4 min-h-4 h-4 w-4" /> },
    ];

    return (
        <div className={"inline-flex items-center gap-1 bg-background border border-input p-1 rounded-md " + (className ?? "")}>
            {items.map((it) => {
                const active = it.key === displayMode;
                return (
                    <SimpleTooltip key={it.key} text={it.title}>
                        <Button
                            size="icon"
                            variant={active ? "default" : "ghost"}
                            className={"w-6 h-6 p-1 rounded-sm " + (active ? "opacity-100" : "opacity-70")}
                            onClick={() => setDisplayMode?.(it.key)}
                            aria-pressed={active}
                        >
                            {it.icon}
                        </Button>
                    </SimpleTooltip>
                );
            })}
        </div>
    );
}
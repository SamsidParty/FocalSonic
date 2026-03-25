import {
    ContextMenuSeparator,
} from "@/app/components/ui/context-menu";
import {
    DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";

interface MenuSeparatorFactoryProps {
    variant: "dropdown" | "context"
}

export function MenuSeparatorFactory({ variant }: MenuSeparatorFactoryProps) {
    if (variant === "context") {
        return <ContextMenuSeparator />;
    }

    return <DropdownMenuSeparator />;
}
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuTrigger,
} from "@/app/components/ui/context-menu";
import { ReactNode } from "react";

interface ProviderProps {
    children: ReactNode
    options?: ReactNode
    onOpenChange?: (open: boolean) => void
}

export function ContextMenuProvider({
    children,
    options,
    onOpenChange,
}: ProviderProps) {
    const hasOptions = options != null;

    return (
        <ContextMenu modal={false} onOpenChange={onOpenChange}>
            <ContextMenuTrigger asChild disabled={!hasOptions}>
                {children}
            </ContextMenuTrigger>
            {hasOptions && (
                <ContextMenuContent className="min-w-56">{options}</ContextMenuContent>
            )}
        </ContextMenu>
    );
}

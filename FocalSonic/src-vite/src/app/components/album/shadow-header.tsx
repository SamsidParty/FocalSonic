import { useAppWindow } from "@/app/hooks/use-app-window";
import { cn } from "@/lib/utils";
import { useTheme } from "@/store/theme.store";
import { ComponentProps } from "react";

type ShadowHeaderProps = ComponentProps<"div"> & {
    showGlassEffect?: boolean
    fixed?: boolean
}

export function ShadowHeader({
    children,
    className,
    showGlassEffect = true,
    fixed = true,
    ...rest
}: ShadowHeaderProps) {

    const { isSidebarOpen } = useAppWindow();
    const { isPlayerAtTop } = useTheme();

    return (
        <div
            className={cn(
                "flex items-center justify-start px-8 h-[--shadow-header-height] border-b bg-background",
                fixed && "fixed right-0 z-30",
                showGlassEffect && "backdrop-blur-lg supports-[backdrop-filter]:bg-background/80",
                "transition-[left] duration-500 ease-long",
                (fixed && isSidebarOpen) ? " left-sidebar" : (fixed && " left-mini-sidebar"),
                isPlayerAtTop ? "top-[calc(var(--player-height)+var(--header-height))]" : "top-header",
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

import { useAppWindow } from "@/app/hooks/use-app-window";
import { cn } from "@/lib/utils";
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

    return (
        <div
            className={cn(
                "flex items-center justify-start px-8 h-[--shadow-header-height] border-b bg-background",
                fixed && "fixed top-header right-0 z-30",
                showGlassEffect && "backdrop-blur-lg supports-[backdrop-filter]:bg-background/80",
                "transition-[left] duration-500 ease-long",
                (fixed && isSidebarOpen) ? " left-sidebar" : (fixed && " left-mini-sidebar"),
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

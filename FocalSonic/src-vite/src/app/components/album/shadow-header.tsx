import { useAppWindow } from "@/app/hooks/use-app-window";
import { cn } from "@/lib/utils";
import { usePlayerStyle } from "@/store/theme.store";
import { ComponentProps } from "react";

type ShadowHeaderProps = ComponentProps<"div"> & {
    showGlassEffect?: boolean
    fixed?: boolean
}

export function ShadowHeader({
    children,
    className,
    showGlassEffect = false,
    fixed = true,
    ...rest
}: ShadowHeaderProps) {

    const { isSidebarOpen } = useAppWindow();
    const { isPlayerAtTop } = usePlayerStyle();

    return (
        <div
            className={cn(
                "flex items-center justify-start px-8 h-[--shadow-header-height] border-b bg-background mr-3 rounded-t-md",
                fixed && "absolute top-0 left-0 right-0 mr-0 z-[30]",
                "transition-[left] duration-500 ease-long",
                className,
            )}
            {...rest}
        >
            {children}
        </div>
    );
}

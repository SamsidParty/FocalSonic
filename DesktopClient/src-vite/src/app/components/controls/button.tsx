import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function ControlButton({
    className,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            data-webview-ignore={""}
            className={cn(
                "inline-flex cursor-default items-center justify-center outline-none",
                className,
            )}
            {...props}
            tabIndex={-1}
        >
            {children}
        </button>
    );
}

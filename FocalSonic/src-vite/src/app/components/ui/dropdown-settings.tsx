import { cn } from "@/lib/utils";
import { EllipsisVertical } from "lucide-react";
import { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";

interface PopoverProps {
    children: ReactNode
    className?: string
}

export function DropdownSettingsPopover({ children, className }: PopoverProps & { className?: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    data-webview-ignore={""}
                    variant="ghost"
                    size="icon"
                    className={cn("size-10 mr-auto rounded-full hover:bg-foreground/20 data-[state=open]:bg-foreground/20", className)}
                >
                    <EllipsisVertical className="size-4" strokeWidth={2.5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="flex flex-col">{children}</div>
            </PopoverContent>
        </Popover>
    );
}

export type DropdownSettingOptions = Omit<ComponentPropsWithoutRef<typeof DropdownSettingWrapper>, "text">

export type DropdownSettingWrapperOptions = ComponentPropsWithoutRef<"div"> & {
    text: string
    showSeparator?: boolean
}

export function DropdownSettingWrapper({
    text,
    className,
    children,
    showSeparator = true,
    ...props
}: DropdownSettingWrapperOptions) {
    return (
        <>
            {showSeparator && <Separator />}
            <div
                className={cn("flex items-center justify-between p-3", className)}
                {...props}
            >
                <span className="text-sm flex-1 text-balance">{text}</span>
                <div className="w-1/2 flex items-center justify-end">{children}</div>
            </div>
        </>
    );
}

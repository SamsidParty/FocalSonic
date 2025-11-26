import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import favicon from "@/assets/favicon.png";
import { service } from "@/service/service";
import { getAppInfo } from "@/utils/appName";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Info, MessagesSquareIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface AboutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    const { t } = useTranslation();
    const { name, version, url } = getAppInfo();
    const { isAppleMusic } = checkServerType();

    const { data: server, isLoading } = useQuery({
        queryKey: [queryKeys.update.serverInfo],
        queryFn: service.ping.pingInfo,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="p-0 overflow-hidden gap-0 cursor-default"
                aria-describedby={undefined}
            >
                <DialogTitle className="sr-only">{t("menu.about")}</DialogTitle>
                <DialogHeader>
                    <div className="flex gap-2 items-center justify-center w-full py-4">
                        <img
                            src={favicon}
                            alt="FocalSonic"
                            className="w-12 h-12 drop-shadow"
                        />
                        <h1 className="font-semibold text-2xl drop-shadow">{name}</h1>
                    </div>
                </DialogHeader>

                <div className="w-full h-full p-6 gap-6 grid grid-cols-4">
                    <div className="flex flex-col gap-6 col-span-3 border-r">
                        <div className="flex flex-col gap-2 h-full text-sm">
                            <span className="font-medium">{t("about.client")}</span>
                            <div className="flex flex-col gap-1 justify-center text-muted-foreground">
                                <div className="flex gap-2">
                                    <p>{t("about.version")}</p>
                                    <div className="text-xs font-medium bg-primary/60 text-foreground px-2 rounded-full border border-primary flex items-center justify-center">
                                        {version}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 h-full text-sm">
                            <span className="font-medium">{t("about.server")}</span>
                            {isLoading && <p>{t("generic.loading")}</p>}
                            {server && !isLoading && (
                                <div className="flex flex-col gap-1 justify-center text-muted-foreground">
                                    <div className="flex gap-2">
                                        <div>{t("about.type")}</div>
                                        <div className="text-xs font-medium bg-primary/60 text-foreground px-2 rounded-full border border-primary flex items-center justify-center">
                                            {server.type}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div>{t(isAppleMusic ? "menu.region" : "about.apiVersion", { region: "" })}</div>
                                        <div className="text-xs font-medium bg-primary/60 text-foreground px-2 rounded-full border border-primary flex items-center justify-center">
                                            {isAppleMusic ? (localStorage.applemusic_region?.toUpperCase() || "US") : server.version}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <a
                            className="w-full px-2 py-1 gap-1 rounded-md bg-primary/60 hover:bg-primary/50 border border-primary text-sm font-medium flex items-center justify-center cursor-pointer"
                            onClick={() => window.open("mailto://support@samsidparty.com")}
                            target="_blank"
                            rel="nofollow noreferrer"
                        >
                            <Info className="min-w-4" />
                            Support
                        </a>
                        {
                            window.igniteView?.commandBridge?.purchaseLicense && (
                                <a
                                    className="w-full px-2 py-1 gap-1 rounded-md bg-primary/60 hover:bg-primary/50 border border-primary text-sm font-medium flex items-center justify-center cursor-pointer"
                                    onClick={() => window.igniteView?.commandBridge?.purchaseLicense()}
                                    target="_blank"
                                    rel="nofollow noreferrer"
                                >
                                    <DollarSign className="min-w-4" />
                                    Restore Purchase
                                </a>
                            )
                        }

                        <a
                            className="w-full px-2 py-1 gap-1 rounded-md bg-primary/60 hover:bg-primary/50 border border-primary text-sm font-medium flex items-center justify-center cursor-pointer"
                            onClick={() => window.open("https://discord.gg/W9wb7rpB94")}
                            target="_blank"
                            rel="nofollow noreferrer"
                        >
                            <MessagesSquareIcon className="min-w-4" />
                            Discord
                        </a>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

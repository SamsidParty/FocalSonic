import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/app/components/ui/dialog";
import favicon from "@/assets/favicon.png";
import { service } from "@/service/service";
import { getAppInfo } from "@/utils/appName";
import { queryKeys } from "@/utils/queryKeys";
import { checkServerType } from "@/utils/servers";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ExternalLink, HeartHandshake, MessagesSquare, Server, Sparkles } from "lucide-react";
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
                className="p-0 overflow-hidden gap-0 cursor-default max-w-md border-primary/20"
                aria-describedby={undefined}
            >
                <DialogTitle className="sr-only">{t("menu.about")}</DialogTitle>
                
                {/* Hero section with gradient background */}
                <div className="relative overflow-hidden">
                    {/* Purple gradient background with blur */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent" />
                    <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center justify-center py-10 px-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl scale-150" />
                            <img
                                src={favicon}
                                alt="FocalSonic"
                                className="relative w-24 h-24 drop-shadow-2xl"
                            />
                        </div>
                        <h1 className="mt-4 font-bold text-3xl tracking-tight">{name}</h1>
                        <div className="mt-2 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("about.version")} {version}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info cards section */}
                <div className="p-5 space-y-4">
                    {/* Server info card */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Server className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">{t("about.server")}</span>
                        </div>
                        {isLoading && (
                            <p className="text-sm text-muted-foreground">{t("generic.loading")}</p>
                        )}
                        {server && !isLoading && (
                            <div className="flex flex-wrap gap-2">
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/15 text-foreground px-3 py-1.5 rounded-full border border-primary/20">
                                    <span className="text-muted-foreground">{t("about.type")}:</span>
                                    <span>{server.type}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/15 text-foreground px-3 py-1.5 rounded-full border border-primary/20">
                                    <span className="text-muted-foreground">
                                        {isAppleMusic ? t("menu.region", { region: "" }).replace(":", "") : t("about.apiVersion", { region: "" }).replace(":", "")}:
                                    </span>
                                    <span>{isAppleMusic ? (localStorage.applemusic_region?.toUpperCase() || "US") : server.version}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200 text-sm font-medium"
                            onClick={() => window.open("mailto://support@samsidparty.com")}
                        >
                            <HeartHandshake className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                            <span>Support</span>
                        </button>
                        
                        <button
                            className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200 text-sm font-medium"
                            onClick={() => window.open("https://discord.gg/W9wb7rpB94")}
                        >
                            <MessagesSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                            <span>Discord</span>
                        </button>
                    </div>

                    {/* Restore purchase button (conditional) */}
                    {window.igniteView?.commandBridge?.purchaseLicense && (
                        <button
                            className="group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200 text-sm font-medium"
                            onClick={() => window.igniteView?.commandBridge?.purchaseLicense()}
                        >
                            <DollarSign className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                            <span>Restore Purchase</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground ml-1" />
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

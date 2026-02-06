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
import { DollarSign, ExternalLink, HeartHandshake, MessagesSquare } from "lucide-react";
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
                
                <div className="relative overflow-hidden">
                    {/* Content */}
                    <div className="relative flex flex-col items-center justify-center py-10 px-6">
                        <div className="relative">
                            <img
                                src={favicon}
                                alt="FocalSonic"
                                className="relative w-24 h-24 drop-shadow-2xl"
                            />
                        </div>
                        <h1 className="mt-4 font-bold text-3xl tracking-tight">{name}</h1>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                {t("about.version")} {version}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info cards section */}
                <div className="p-5 space-y-2">

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
                            onClick={() => window.open("https://discord.gg/ActpSQGynG")}
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

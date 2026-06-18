import { AirplayIcon, CastIcon, RefreshCwIcon, SpeakerIcon, UnplugIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Fragment } from "react/jsx-runtime";

import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { LogoutObserver } from "@/app/observers/logout-observer";
import { isMac } from "@/utils/osType";
import clsx from "clsx";

interface DeviceReference {
    Name: string;
    ReferenceID: string;
    // "chromecast" (remote playback) or "airplay" (direct local capture).
    Type?: string;
}

export function useCastStatus() {
    const [castStatus, setCastStatus] = useState<string | null>(null);
    const [castDeviceType, setCastDeviceType] = useState<string | null>(null);

    const updateCastStatus = async () => {
        const status = await window.igniteView?.commandBridge?.getCastStatus?.();
        setCastStatus(status || null);
        const type = await window.igniteView?.commandBridge?.getCastDeviceType?.();
        setCastDeviceType(type || null);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            updateCastStatus();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return { castStatus, setCastStatus, castDeviceType };
}

export function Cast() {

    const [deviceList, setDeviceList] = useState<DeviceReference[]>([]);   
    const [isScanning, setIsScanning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { castStatus, setCastStatus } = useCastStatus();

    const { t } = useTranslation();
    const alignPosition = isMac ? "end" : "center";

    const scanForDevices = async () => {
        setIsScanning(true);
        const devices = await window.igniteView?.commandBridge?.getCastDevices?.();
        setDeviceList(devices || []);
        setIsScanning(false);
    };


    useEffect(() => {
        scanForDevices();
    }, []);

    const scanAgain = (e) => {
        e.stopPropagation();
        e.preventDefault();
        scanForDevices();
    };

    const castToDevice = async (deviceReferenceID: string) => {
        setCastStatus(deviceReferenceID);
        await window.igniteView?.commandBridge?.startCasting?.(deviceReferenceID);
    };

    const stopCasting = async () => {
        setCastStatus(null);
        await window.igniteView?.commandBridge?.disconnectCast?.();
    };

    return (
        <Fragment>
            <LogoutObserver />

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger className="user-dropdown-trigger">
                    <Avatar className="w-8 h-8 rounded-md cursor-pointer">
                        <AvatarFallback className="text-sm bg-transparent hover:bg-accent rounded-md">
                            <CastIcon className={clsx("w-4 h-4", !!castStatus && "text-primary")} />
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={alignPosition} className="min-w-64">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-2">
                            <p className="text-sm font-medium leading-none">{t("menu.cast")}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {t(deviceList.length > 0 ? "menu.castDescription" : "menu.castNoDevices")}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {
                        deviceList.map((device) => {
                            const DeviceIcon = device.Type === "airplay" ? AirplayIcon : SpeakerIcon;
                            return (
                                <DropdownMenuItem disabled={!!castStatus} onClick={() => castToDevice(device.ReferenceID)} key={device.ReferenceID}>
                                    <DeviceIcon className={clsx("mr-2 h-4 w-4", !!(castStatus == device.ReferenceID) && "text-primary")} />
                                    <span className={clsx(!!(castStatus == device.ReferenceID) && "text-primary")}>{device.Name}</span>
                                </DropdownMenuItem>
                            );
                        })
                    }

                    {
                        !!castStatus ? (
                            <DropdownMenuItem onClick={stopCasting}>
                                <UnplugIcon className="mr-2 h-4 w-4" />
                                <span>{t("menu.castStop")}</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem disabled={isScanning} onClick={scanAgain}>
                                <RefreshCwIcon className="mr-2 h-4 w-4" />
                                <span>{t("menu.castRefresh")}</span>
                            </DropdownMenuItem>
                        )
                    }

                </DropdownMenuContent>
            </DropdownMenu>
        </Fragment>
    );
}

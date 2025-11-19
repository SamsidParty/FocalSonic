import { CastIcon, RefreshCwIcon, SpeakerIcon } from "lucide-react";
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

interface DeviceReference {
    Name: string;
    ReferenceID: string
}

export function Cast() {

    const [deviceList, setDeviceList] = useState<DeviceReference[]>([]);   
    const [isScanning, setIsScanning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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
        await window.igniteView?.commandBridge?.startCasting?.(deviceReferenceID);
    };

    return (
        <Fragment>
            <LogoutObserver />

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger className="user-dropdown-trigger">
                    <Avatar className="w-8 h-8 rounded-md cursor-pointer">
                        <AvatarFallback className="text-sm bg-transparent hover:bg-accent rounded-md">
                            <CastIcon className="w-4 h-4" />
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
                        deviceList.map((device) => (
                            <DropdownMenuItem onClick={() => castToDevice(device.ReferenceID)} key={device.ReferenceID}>
                                <SpeakerIcon className="mr-2 h-4 w-4" />
                                <span>{device.Name}</span>
                            </DropdownMenuItem>
                        ))
                    }

                    <DropdownMenuItem disabled={isScanning} onClick={scanAgain}>
                        <RefreshCwIcon className="mr-2 h-4 w-4" />
                        <span>{t("menu.castRefresh")}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Fragment>
    );
}

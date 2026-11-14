import { AirplayIcon, LaptopIcon, MonitorIcon, RefreshCwIcon, ServerIcon, SpeakerIcon, TvMinimalPlayIcon, UnplugIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
    // "chromecast" (remote playback), "airplay" (direct local capture), or "airplay-picker"
    // (macOS: opens Apple's AirPlay picker, since macOS doesn't let apps list the speakers).
    Type?: string;
    Icon?: string;
}

const DEVICE_ICONS = {
    appletv: TvMinimalPlayIcon,
    homepod: SpeakerIcon,
    macbook: LaptopIcon,
    imac: MonitorIcon,
    mac: ServerIcon, // Closest icon to what Apple devices would show for mac minis
    airplay: AirplayIcon,
} as const;

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
    const triggerRef = useRef<HTMLButtonElement>(null);

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

    // The picker is anchored to the cast button, where the menu was.
    const openAirPlayPicker = async () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        await window.igniteView?.commandBridge?.showAirPlayPicker?.(rect.left, rect.top, rect.width, rect.height);
    };

    const stopCasting = async () => {
        setCastStatus(null);
        await window.igniteView?.commandBridge?.disconnectCast?.();
    };

    return (
        <Fragment>
            <LogoutObserver />

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger ref={triggerRef} className="user-dropdown-trigger">
                    <Avatar className="w-8 h-8 rounded-md cursor-pointer">
                        <AvatarFallback className="text-sm bg-transparent hover:bg-accent rounded-md">
                            <AirplayIcon className={clsx("w-4 h-4", !!castStatus && "text-primary")} />
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
                            const DeviceIcon = DEVICE_ICONS[device.Icon as keyof typeof DEVICE_ICONS]
                                ?? (device.Type?.startsWith("airplay") ? AirplayIcon : SpeakerIcon);
                            // The picker stays available while it's in use, to change speakers.
                            const isPicker = device.Type === "airplay-picker";
                            const disabled = !!castStatus && !(isPicker && castStatus == device.ReferenceID);
                            return (
                                <DropdownMenuItem
                                    disabled={disabled}
                                    onClick={() => isPicker ? openAirPlayPicker() : castToDevice(device.ReferenceID)}
                                    key={device.ReferenceID}
                                >
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

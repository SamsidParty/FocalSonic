import { checkServerType } from "@/utils/servers";
import clsx from "clsx";
import { t } from "i18next";
import { ArrowRightIcon } from "lucide-react";
import React from "react";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/searchinput";

export default function Search() {
    const { isAppleMusic } = checkServerType();

    return (
        <div 
            className={
                clsx(
                    "flex h-screen items-center justify-center",
                    "pb-player"
                )
            }
        >
            <div className="w-full flex items-center justify-between gap-2 flex-row max-w-2xl">
                <SearchInput
                    placeholder={t("command.inputPlaceholder")}
                    className="w-full"
                    autoFocus
                />
                <Button>
                    <ArrowRightIcon />
                </Button>
            </div>
        </div>
    );
}

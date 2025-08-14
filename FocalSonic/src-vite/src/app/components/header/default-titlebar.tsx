import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion"
import { isLinux } from "@/utils/osType"
import { isWindows } from "react-device-detect"
import { Windows } from "../controls/windows"
import { AppTitle } from "./app-title"

export default function DefaultTitlebar() {
    return (
        <>
            {!isLinux && (
                <header
                    {...igniteViewDragRegion}
                    className="w-full h-header border-b bg-bar flex justify-center items-center relative"
                >
                    <AppTitle />
                    <div className="flex items-center absolute right-0">
                        {isWindows && <Windows />}
                    </div>
                </header>
            )}
        </>
    )
}
import { Windows } from "@/app/components/controls/windows";
import { LoginForm } from "@/app/components/login/form";
import { igniteViewDragRegion } from "@/utils/igniteViewDragRegion";
import { isLinux, isWindows } from "@/utils/osType";
import DefaultTitlebar from "../components/header/default-titlebar";

export default function Login() {

    return (
        <div className="flex flex-col w-screen h-screen">
            {!isLinux && (
                <header
                    {...igniteViewDragRegion}
                    className="w-full h-header border-b bg-background flex justify-center items-center relative"
                >
                    <DefaultTitlebar />
                    <div className="flex items-center absolute right-0">
                        {isWindows && <Windows />}
                    </div>
                </header>
            )}
            <main className="flex flex-col w-full h-full justify-center items-center bg-bar">

                {/* Blurred logo effect */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 blur-[120px] saturate-150 opacity-40">
                    <div className="rounded-full w-[50vh] h-[50vh] bg-[#7C81F5]"/>
                </div>

                <LoginForm />
            </main>
        </div>
    );
}

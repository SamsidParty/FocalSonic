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
            <main className="flex flex-col w-full h-full justify-center items-center bg-body">
                <LoginForm />
            </main>
        </div>
    );
}

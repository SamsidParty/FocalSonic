import type { Status } from "../types/status";

export default function SplashScreen({ status }: { status: Status }) {
    return (
        <div className="splash-screen w-full h-full flex flex-col justify-center items-center text-white">
            <img className="w-150" alt="splash screen logo" src="./images/splash.webp"></img>
            <p>{status.statusMessage}</p>
        </div>
    );
}
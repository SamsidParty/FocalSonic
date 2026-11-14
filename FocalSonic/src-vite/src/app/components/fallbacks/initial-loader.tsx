import { useSignOut } from "@/store/app.store";
import { t } from "i18next";
import { useEffect, useState } from "react";
import LensRipple from "../ui/Backgrounds/LensRipple";
import { AppleMusicIconLarge } from "../icons/apple";

export default function InitialLoader() {

    const [loadingIsStuck, setLoadingIsStuck] = useState(false);
    const signOut = useSignOut();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingIsStuck(true);
        }, 15000);

        return () => clearTimeout(timer);
    }, []);

    const resolveSignInIssues = async () => {
        signOut();
    };

    return (
        <>

            <div className="absolute inset-0 -z-10">
                <LensRipple
                    strength={120}
                    glass={1}
                    speed={0.15}
                    rings={1}
                    width={150}
                    className="w-full h-full"
                >
                    <AppleMusicIconLarge className="w-[50vh] fill-foreground"/>
                </LensRipple>
            </div>

            <div className="h-80"></div>

            <h2 className="font-semibold text-lg">{t("login.appleMusic.loading")}</h2>

            {
                loadingIsStuck ? (
                    <p className="text-md">{t("login.appleMusic.loadingStuck")} <a onClick={resolveSignInIssues} className="inline cursor-pointer text-[#FF0436]">{t("login.appleMusic.resolveIssues")}</a></p>
                )
                    : (<p className="text-md">{t("login.appleMusic.loadingDescription")}</p>)
            }

        </>
    );
}
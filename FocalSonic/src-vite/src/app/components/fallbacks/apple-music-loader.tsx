import { useSignOut } from "@/store/app.store";
import { t } from "i18next";
import { useEffect, useState } from "react";

export default function AppleMusicLoader() {

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
            <img className="w-60 mb-4" src="/icons/applemusic.svg"/>
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
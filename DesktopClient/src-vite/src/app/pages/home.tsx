import { checkServerType } from "@/utils/servers";
import AppleMusicHome from "./applemusic-home";
import SubsonicHome from "./subsonic-home";

export default function Home() {
    const { isAppleMusic } = checkServerType();

    return (
        <div>
            {isAppleMusic ? (
                <AppleMusicHome/>
            ) : (
                <SubsonicHome/>
            )}
        </div>
    );
}

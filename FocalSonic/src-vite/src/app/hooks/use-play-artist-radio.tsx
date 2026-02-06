import { getArtistAllSongs } from "@/queries/songs";
import { usePlayerActions } from "@/store/player.store";
import { ISimilarArtist } from "@/types/responses/artist";
import { checkServerType } from "@/utils/servers";

export default function usePlayArtistRadio() {

    const { isAppleMusic } = checkServerType();
    const { setSongList } = usePlayerActions();
    const { setPlayAppleMusicRadio } = usePlayerActions();

    const playArtistRadio = async (artist: ISimilarArtist, shuffle: boolean = false) => {
        
        if (isAppleMusic) {
            const station = "ra.a-" + artist.id;
            setPlayAppleMusicRadio({ id: station });
            return;
        }

        const songList = await getArtistAllSongs(isAppleMusic ? artist.id : artist.name);

        if (songList) {
            setSongList(songList, 0, shuffle);
        }
    };

    return {
        playArtistRadio
    };
}
// Key issued to FocalSonic by Last.fm
// If you steal it I will blow up your house 🥰
const lastFmApiKey = "7746ab31f725273e9ae23f25b1e29e12";

export interface LastFmArtist {
    name?: string;
    url?: string;
    bio?: {
        summary?: string;
        content?: string;
    };
}

export function fetchLastFmArtistInfo(artistName: string): Promise<LastFmArtist | null> {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
        artistName
    )}&api_key=${lastFmApiKey}&format=json`;

    return fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                return null;
            }
            return response.json();
        })
        .then((data) => {
            if (data && data.artist) {
                return data.artist as LastFmArtist;
            }
            return null;
        });
}
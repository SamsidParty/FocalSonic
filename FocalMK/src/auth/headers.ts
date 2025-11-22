export async function getFetchHeaders() {
    return {
        "Authorization": `Bearer ` + window.virtualMusicKit?.getInstance().developerToken || "",
        "X-Apple-Music-User-Token": window.virtualMusicKit?.getInstance().musicUserToken || "",
        "X-Apple-Renewal": "1",
    }
}
function setupTitlebar() {
    const titlebar = document.createElement("div");
    titlebar.className = "igniteview-titlebar";
    titlebar.setAttribute("data-webview-drag", "true");
    document.body.appendChild(titlebar);
    titlebar.style.width = "100%";
    titlebar.style.height = "54px";
    titlebar.style.position = "absolute";
    titlebar.style.top = "0";
    titlebar.style.left = "0";
    titlebar.style.right = "0";
    titlebar.style.zIndex = "999999";
}

// MusicKit JS only checks that a music user token is stored, not that Apple still accepts it.
// These tokens expire (after about six months) and can't be renewed, so an old web session
// would hand back a dead token forever. Asks Apple, and only a clear rejection counts as dead:
// a network hiccup shouldn't block signing in.
async function isTokenRejected(music) {
    try {
        const response = await fetch("https://amp-api.music.apple.com/v1/me/storefront", {
            headers: {
                "Authorization": `Bearer ${music.developerToken}`,
                "Media-User-Token": music.musicUserToken,
            },
        });
        return response.status === 401 || response.status === 403;
    }
    catch {
        return false;
    }
}

let isCheckingAuthState = false;
let hasDiscardedStaleToken = false;

async function checkAuthState() {
    if (isCheckingAuthState) return;
    isCheckingAuthState = true;
    try {
        await tryHandOverToken();
    }
    finally {
        isCheckingAuthState = false;
    }
}

async function tryHandOverToken() {
    const music = window.MusicKit?.getInstance();

    if (music && music.isAuthorized && music.musicUserToken) {
        // Sign the stale session out so the user signs in again and Apple mints a fresh token.
        // This only happens once per window, so a fresh token that also fails can't loop.
        if (!hasDiscardedStaleToken && await isTokenRejected(music)) {
            hasDiscardedStaleToken = true;
            console.warn("[FocalSonic][Apple Music Sign In] Stored token was rejected, signing out of the web session");
            try {
                await music.unauthorize();
            }
            catch (err) {
                console.error("[FocalSonic][Apple Music Sign In] unauthorize() failed:", err);
            }
            return;
        }

        // Send the token once. window.close() is ignored on some platforms (Qt WebEngine on Linux),
        // so the host closes this window after receiving it instead.
        clearInterval(window.checkAuthStateInterval);
        window.igniteView?.commandBridge.appleMusicSignInRecieveToken(music.musicUserToken, music.developerToken);
        window.close();
    }
}

addEventListener("beforeunload", window.close); // Closes the window if the user tries to navigate away
setupTitlebar();
window.checkAuthStateInterval = setInterval(checkAuthState, 500);

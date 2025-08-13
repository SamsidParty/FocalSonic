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

async function checkAuthState() {
    const music = MusicKit?.getInstance();

    if (music && music.isAuthorized && music.musicUserToken) {
        igniteView.commandBridge.appleMusicSignInRecieveToken(music.musicUserToken, music.developerToken, music.storefrontCountryCode || "us");
        window.close();
    }
}

addEventListener("beforeunload", window.close); // Closes the window if the user tries to navigate away
setupTitlebar();
setInterval(checkAuthState, 500);

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

setupTitlebar();
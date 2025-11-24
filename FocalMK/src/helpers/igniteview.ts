export function isIgniteView() {
    return window?.igniteView?.commandBridge !== undefined;
}

export function tryWrapAppleMusicURL(url: string) {
    if (isIgniteView() && window.igniteView.resolverURL) {
        return window.igniteView.resolverURL + "/applemusic?" + encodeURIComponent(url);
    }
    return url;
}
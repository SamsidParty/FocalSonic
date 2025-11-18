
async function send(id: string) {
    if (window.igniteView) {
        window.igniteView.commandBridge.scrobble();
    }
}

export const scrobble = {
    send,
};

if (window && !window.checkAuth) {
    window.checkAuth = async () => {

        console.log("[FocalSonic][Last.FM Sign In]: Trying to detect last.fm token...");

        // Extract the token from the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) return;

        console.log("[FocalSonic][Last.FM Sign In]: Found last.fm token, determining where to send it...", token);

        if (window?.igniteView?.commandBridge?.recieveLastFMToken) {
            console.log("[FocalSonic][Last.FM Sign In]: Sending last.fm token via IgniteView command 'recieveLastFMToken'");
            await window.igniteView.commandBridge.recieveLastFMToken(token);
            window.close(); // Close the sign in window
        }
    }
}

window.checkAuth();
// The request goes through C# (translateLyrics) because the webview's direct
// requests to translate.googleapis.com are blocked by CORS.
export async function translateText(text, targetLanguage, romaji) {
    if (!window?.igniteView?.commandBridge?.translateLyrics) return null;

    try {
        const raw = await window.igniteView.commandBridge.translateLyrics(text, targetLanguage, !!romaji);
        if (!raw) return null;

        const data = JSON.parse(raw);
        let translatedText = "";
        data[0].forEach(part => {
            if (romaji) {
                translatedText += part[2] || "";
            }
            else {
                translatedText += part[0] || "";
            }
        });
        if (text.trim().toLowerCase() === translatedText.trim().toLowerCase() && text.trim() !== "") {
            return null;
        }
        return translatedText;
    } catch (error) {
        console.error("Translation error:", error);
        return null;
    }
}

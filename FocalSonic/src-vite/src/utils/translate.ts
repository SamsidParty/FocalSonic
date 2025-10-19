export function getTranslationURL (lang: string, text: string): string {
    return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
}

export async function translateText(text, targetLanguage) {
    const cacheKey = `${targetLanguage}_${text}`;
    const url = getTranslationURL(targetLanguage, text);


    return fetch(url, {
        cache: "force-cache",
    })
        .then(response => response.json())
        .then(data => {
            const originalLanguage = data[2];
            let translatedText = "";
            data[0].forEach(part => {
                translatedText += part[0];
            });
            if (text.trim().toLowerCase() === translatedText.trim().toLowerCase() && text.trim() !== "") {
                return null;
            } else {
                const result = { originalLanguage, translatedText };
                return result.translatedText;
            }
        })
        .catch(error => {
            console.error("Translation error:", error);
            return null;
        });
}
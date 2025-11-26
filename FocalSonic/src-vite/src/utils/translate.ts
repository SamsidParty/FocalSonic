export function getTranslationURL (lang: string, text: string, romaji?: boolean): string {
    return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${romaji ? lang : "auto"}&tl=${lang}${romaji ? "-Latn&dt=rm" : ""}&dt=t&q=${encodeURIComponent(text)}`;
}

export async function translateText(text, targetLanguage, romaji) {
    const cacheKey = `${targetLanguage}_${text}`;
    const url = getTranslationURL(targetLanguage, text, romaji);


    return fetch(url, {
        cache: "force-cache",
    })
        .then(response => response.json())
        .then(data => {
            const originalLanguage = data[2];
            let translatedText = "";
            data[0].forEach(part => {
                if (romaji) {
                    translatedText += part[2] || "";
                }
                else {
                    translatedText += part[0] || "";;
                }
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
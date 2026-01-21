export interface IPersongInterface {
    setVideoBackgroundURL: (url: string) => void; // Sets videoBackgroundURL and customBackgroundType to "video"
    clearCustomBackground: () => void; // Wipes customBackgroundType and videoBackgroundURL
}

export interface IPersongContext {
    id: string;
    customBackgroundType: "video" | undefined;
    videoBackgroundURL: string | undefined;
}


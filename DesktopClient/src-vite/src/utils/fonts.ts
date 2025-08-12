export function resolveFont(fontName: string) {
    if (fontName === "System") {
        return "var(--system-font)";
    }
    return fontName;
}
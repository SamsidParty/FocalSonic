import {
    Content,
    ContentItem,
    ContentItemForm,
    ContentItemTitle,
    ContentSeparator,
    Root,
} from "@/app/components/settings/section";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { useTheme } from "@/store/theme.store";
import { resolveFont } from "@/utils/fonts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function FontSelect() {
    const { t } = useTranslation();
    const { uiFont, setUIFont, lyricsFont, setLyricsFont } = useTheme();
    const [currentUIFont, setCurrentUIFont] = useState<string>(uiFont);
    const [currentLyricsFont, setCurrentLyricsFont] = useState<string>(lyricsFont);
    const builtinFonts = ["Sora", "sans-serif"];

    const { isLoading, error, data } = useQuery({
        queryKey: ["fonts"],
        queryFn: async () => (await igniteView?.commandBridge.getInstalledFonts()) || [],
    });

    const availableFonts = Array.from(new Set([...builtinFonts, ...(data || [])]));

    const changeUIFont = (font: string) => {
        setUIFont(font);
        setCurrentUIFont(font);
    };

    const changeLyricsFont = (font: string) => {
        setLyricsFont(font);
        setCurrentLyricsFont(font);
    };

    return (
        <>
            <FontDropDown title={t("settings.appearance.font.ui")} currentFont={currentUIFont} setCurrentFont={changeUIFont} availableFonts={availableFonts} />
            <FontDropDown title={t("settings.appearance.font.lyrics")} currentFont={currentLyricsFont} setCurrentFont={changeLyricsFont} availableFonts={availableFonts} />
            <ContentSeparator />
        </>
    );
}

function FontDropDown({ title, currentFont, setCurrentFont, availableFonts }: { title: string; currentFont: string; setCurrentFont: (font: string) => void; availableFonts: string[]; }) {

    return (
        <Root>
            <Content>
                <ContentItem>
                    <ContentItemTitle>{title}</ContentItemTitle>
                    <ContentItemForm>
                        <Select value={currentFont} onValueChange={setCurrentFont}>
                            <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                                <SelectValue>
                                    <span className="text-sm text-foreground" style={{ fontFamily: resolveFont(currentFont) }}>
                                        {currentFont}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectGroup>
                                    {availableFonts.map((font, i) => (
                                        <SelectItem
                                            key={i}
                                            value={font}
                                        >
                                            <span className="text-sm text-foreground" style={{ fontFamily: resolveFont(font) }}>
                                                {font}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </ContentItemForm>
                </ContentItem>
            </Content>
        </Root>
    );
}
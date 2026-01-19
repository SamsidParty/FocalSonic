import { Content, ContentItem, ContentItemForm, ContentItemTitle, ContentSeparator, Root } from "@/app/components/settings/section";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { appThemes } from "@/app/observers/theme-observer";
import { useTheme } from "@/store/theme.store";
import { Theme } from "@/types/themeContext";
import clsx from "clsx";
import { Check, Minus } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function ThemeSettingsPicker() {
    const { t } = useTranslation();
    const { theme: currentTheme, setTheme } = useTheme();


    return (
        <div className="h-full space-y-4">
            {
                (currentTheme == Theme.System && window.igniteView && window.igniteView.platformHints.includes("win32")) && (
                    <>
                        <VibrancySelector/>
                        <AccentColorPicker/>
                    </>
                )
            }
            <ContentItemTitle>{t("theme.label")}</ContentItemTitle>
            <div className="w-full h-full grid grid-cols-4 gap-3">
                {appThemes.map((theme) => {
                    const isActive = theme === currentTheme;

                    // Disable system theme if not running in igniteview
                    if (theme == Theme.System && !window.igniteView) { return; }

                    return (
                        <div key={theme} onClick={() => setTheme(theme)}>
                            <ThemePlaceholder theme={theme} />
                            <ThemeTitle theme={theme} isActive={isActive} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ThemePlaceholder({ theme }: { theme: Theme }) {

    return (
        <div className={theme}>
            <div className="bg-background h-10 border border-border rounded overflow-hidden flex cursor-pointer">
                <div className="w-full h-full bg-background-foreground flex flex-row gap-1 p-1 *:w-full *:h-full *:rounded-[2px]">
                    <div className="bg-accent" />
                    <div className="bg-primary" />
                    <div className="bg-muted" />
                    <div className="bg-secondary" />
                </div>
            </div>
        </div>
    );
}

type ThemeTitleProps = {
    isActive: boolean
    theme: Theme
}

export function ThemeTitle({ isActive, theme }: ThemeTitleProps) {
    const { t } = useTranslation();

    return (
        <span
            className={clsx(
                "mt-1 flex items-center gap-1",
                !isActive && "text-muted-foreground/70",
            )}
        >
            <Check
                size={16}
                strokeWidth={2}
                className={clsx(!isActive && "hidden")}
                aria-hidden="true"
            />
            <Minus
                size={16}
                strokeWidth={2}
                className={clsx(isActive && "hidden")}
                aria-hidden="true"
            />
            <span className="text-xs font-medium">{t(`theme.${theme}`)}</span>
        </span>
    );
}

function AccentColorPicker() {
    const { accentColor, setAccentColor } = useTheme();
    const { t } = useTranslation();


    const [localColor, setLocalColor] = React.useState(accentColor || "#ffffff");
    const timeoutRef = React.useRef<number | null>(null);
    const pendingRef = React.useRef<string | null>(null);
    const DEBOUNCE_MS = 300;

    React.useEffect(() => {
        setLocalColor(accentColor || "#ffffff");
    }, [accentColor]);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const commit = React.useCallback(() => {
        if (pendingRef.current != null) {
            setAccentColor(pendingRef.current);
            pendingRef.current = null;
        }
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [setAccentColor]);

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value;
        setLocalColor(value);
        pendingRef.current = value;

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(commit, DEBOUNCE_MS);
    }, [commit]);

    // ensure final value is committed when user finishes interaction
    const handleCommitInteraction = React.useCallback(() => commit(), [commit]);

    return (
        <Root>
            <Content>
                <ContentItem>
                    <ContentItemTitle>{t("settings.appearance.colors.accentColor")}</ContentItemTitle>
                    <ContentItemForm>
                        <input
                            type="color"
                            value={localColor}
                            onChange={handleChange}
                            onBlur={handleCommitInteraction}
                            onPointerUp={handleCommitInteraction}
                            onMouseUp={handleCommitInteraction}
                            className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer rounded-md"
                        />
                    </ContentItemForm>
                </ContentItem>
            </Content>
            <ContentSeparator />
        </Root>
    );
}

function VibrancySelector() {

    const { vibrancyMode, setVibrancyMode } = useTheme();
    const { t } = useTranslation();

    return (
        <Root>
            <Content>
                <ContentItem>
                    <ContentItemTitle>{t("settings.appearance.vibrancy.title")}</ContentItemTitle>
                    <ContentItemForm>
                        <Select value={vibrancyMode} onValueChange={setVibrancyMode}>
                            <SelectTrigger className="h-8 ring-offset-transparent focus:ring-0 focus:ring-transparent text-left">
                                <SelectValue>
                                    <span className="text-sm text-foreground">
                                        {t(`settings.appearance.vibrancy.${vibrancyMode}`)}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectGroup>
                                    <SelectItem
                                        key={"mica"}
                                        value={"mica"}
                                    >
                                        <span className="text-sm text-foreground">
                                            {t("settings.appearance.vibrancy.mica")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        key={"mica-alt"}
                                        value={"mica-alt"}
                                    >
                                        <span className="text-sm text-foreground">
                                            {t("settings.appearance.vibrancy.mica-alt")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        key={"acrylic"}
                                        value={"acrylic"}
                                    >
                                        <span className="text-sm text-foreground">
                                            {t("settings.appearance.vibrancy.acrylic")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        key={"blurbehind"}
                                        value={"blurbehind"}
                                    >
                                        <span className="text-sm text-foreground">
                                            {t("settings.appearance.vibrancy.blurbehind")}
                                        </span>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </ContentItemForm>
                </ContentItem>
            </Content>
        </Root>
    );
}
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { fetchProviderLyrics, LYRIC_PROVIDERS, LyricProviderId, ProviderLyricResult } from "@/service/lyrics/providers";
import { useAppRuntimeState } from "@/store/app.store";
import { usePlayerSonglist } from "@/store/player.store";
import { checkServerType } from "@/utils/servers";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Music, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { LyricsTab } from "../fullscreen/lyrics";

type ProviderState = {
    status: "loading" | "done"
    entries: ProviderLyricResult[]
}

type Entry = ProviderLyricResult & { key: string }

export function LyricsFinderDialog() {
    const { lyricsFinderDialogState: open, setLyricsFinderDialogState: setOpen } = useAppRuntimeState();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="flex flex-col gap-0 overflow-hidden p-0 h-[700px] max-h-[85vh] max-w-3xl 2xl:max-w-4xl"
                aria-describedby={undefined}
            >
                {open && <LyricsFinderContent onClose={() => setOpen(false)} />}
            </DialogContent>
        </Dialog>
    );
}

function LyricsFinderContent({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const { currentSong } = usePlayerSonglist();
    const queryClient = useQueryClient();

    // currentSong.id already resolves to the Apple catalog ID when on Apple Music.
    const defaultAppleId = currentSong.appleMusic?.data?.attributes?.playParams?.catalogId
        ?? (checkServerType().isAppleMusic ? String(currentSong.id ?? "") : "");

    const [title, setTitle] = useState(currentSong.title ?? "");
    const [artist, setArtist] = useState(currentSong.artist ?? "");
    const [album, setAlbum] = useState(currentSong.album ?? "");
    const [duration, setDuration] = useState(currentSong.duration ? String(currentSong.duration) : "");
    const [appleMusicId, setAppleMusicId] = useState<string>(defaultAppleId);

    const [results, setResults] = useState<Partial<Record<LyricProviderId, ProviderState>>>({});
    const [searched, setSearched] = useState(false);
    const [applyingKey, setApplyingKey] = useState<string | null>(null);

    const runSearch = () => {
        if (!title.trim()) return;

        setSearched(true);
        const query = {
            title: title.trim(),
            artist: artist.trim(),
            album: album.trim() || undefined,
            duration: Number(duration) || undefined,
            appleMusicId: appleMusicId.trim() || undefined,
        };

        for (const provider of LYRIC_PROVIDERS) {
            setResults((prev) => ({ ...prev, [provider.id]: { status: "loading", entries: [] } }));

            fetchProviderLyrics(provider.id, query)
                .then((entries) => setResults((prev) => ({ ...prev, [provider.id]: { status: "done", entries } })))
                .catch(() => setResults((prev) => ({ ...prev, [provider.id]: { status: "done", entries: [] } })));
        }
    };

    const applyLyrics = async (entry: Entry) => {
        if (!currentSong.id) return;

        setApplyingKey(entry.key);
        try {
            await window.igniteView?.commandBridge?.saveLyricOverride(currentSong.id, entry.lyrics);
            await queryClient.invalidateQueries({ queryKey: ["get-lyrics"] });
            toast.success(t("lyricsFinder.applied"));
            onClose();
        } catch {
            toast.error(t("lyricsFinder.applyFailed"));
        } finally {
            setApplyingKey(null);
        }
    };

    const loadingNames = LYRIC_PROVIDERS.filter((p) => (results[p.id]?.status ?? "loading") === "loading").map((p) => p.name);
    const allDone = searched && LYRIC_PROVIDERS.every((p) => results[p.id]?.status === "done");
    const entries: Entry[] = LYRIC_PROVIDERS.flatMap((p) => (results[p.id]?.entries ?? []).map((entry, i) => ({ ...entry, key: `${p.id}-${i}` })));

    return (
        <>
            <div className="flex flex-col gap-4 border-b p-6 pb-5">
                <div className="space-y-1">
                    <DialogTitle className="text-xl font-semibold">{t("lyricsFinder.title")}</DialogTitle>
                    <DialogDescription>{t("lyricsFinder.description")}</DialogDescription>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t("lyricsFinder.fields.title")}>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
                    </Field>
                    <Field label={t("lyricsFinder.fields.artist")}>
                        <Input value={artist} onChange={(e) => setArtist(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
                    </Field>
                    <Field label={t("lyricsFinder.fields.album")}>
                        <Input value={album} onChange={(e) => setAlbum(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
                    </Field>
                    <Field label={t("lyricsFinder.fields.duration")}>
                        <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
                    </Field>
                </div>

                {/* Hidden apple music catalog ID — only used for the Apple Music source. */}
                <input type="hidden" value={appleMusicId} onChange={(e) => setAppleMusicId(e.target.value)} />

                <Button onClick={runSearch} disabled={!title.trim()} className="w-full sm:w-auto sm:self-end">
                    <Search className="mr-2 size-4" />
                    {t("lyricsFinder.search")}
                </Button>
            </div>

            <ScrollArea className="flex-1 overflow-hidden" thumbClassName="secondary-thumb-bar">
                <div className="space-y-4 p-6">
                    {!searched && <EmptyState>{t("lyricsFinder.searchPrompt")}</EmptyState>}

                    {searched && loadingNames.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            {t("lyricsFinder.searchingSources", { sources: loadingNames.join(", ") })}
                        </div>
                    )}

                    {entries.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {entries.map((entry) => (
                                <EntryCard
                                    key={entry.key}
                                    entry={entry}
                                    applying={applyingKey === entry.key}
                                    onApply={applyLyrics}
                                />
                            ))}
                        </div>
                    )}

                    {allDone && entries.length === 0 && <EmptyState>{t("lyricsFinder.noneFound")}</EmptyState>}
                </div>
            </ScrollArea>
        </>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

function EntryCard({ entry, applying, onApply }: {
    entry: Entry
    applying: boolean
    onApply: (entry: Entry) => void
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col rounded-xl border bg-background-foreground/40 p-4">
            <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="gap-1.5">
                    <Music className="size-3" />
                    {entry.provider}
                </Badge>

                <Button size="sm" className="h-7" disabled={applying} onClick={() => onApply(entry)}>
                    {applying
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <><Check className="mr-1 size-3.5" />{t("lyricsFinder.apply")}</>}
                </Button>
            </div>

            <div className="mt-3 min-w-0">
                <p className="truncate font-medium">{entry.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                    {[entry.artist, entry.album].filter(Boolean).join(" · ")}
                </p>
            </div>

            <div className="mt-3 h-40 overflow-hidden rounded-lg border bg-background/50 px-2">
                <LyricsTab customLyrics={entry.lyrics} small leftAlign visible disableAltLyrics />
            </div>
        </div>
    );
}

function EmptyState({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <Search className="size-8 opacity-40" />
            <p className="max-w-xs text-sm">{children}</p>
        </div>
    );
}

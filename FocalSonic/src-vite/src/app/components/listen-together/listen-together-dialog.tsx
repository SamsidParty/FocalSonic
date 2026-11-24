import clsx from "clsx";
import {
    AlertTriangle,
    ArrowRight,
    Check,
    Copy,
    Headphones,
    Loader2,
    LogOut,
    RadioTower,
    Users,
} from "lucide-react";
import { ClipboardEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
    ListenTogetherParticipant,
    ListenTogetherStatus,
    listenTogether,
    useListenTogetherStore,
} from "@/store/listen-together.store";

const CODE_LENGTH = 16;
// Crockford base32, as the C# side generates and parses (see JoinCode).
const CODE_CHARS = /[0-9A-HJKMNP-TV-Z]/;

/** Uppercases, maps look-alikes and keeps the last 16 valid characters (so a pasted link works too). */
function normalizeCode(input: string) {
    const mapped = input
        .toUpperCase()
        .replace(/O/g, "0")
        .replace(/[IL]/g, "1")
        .replace(/U/g, "V")
        .split("")
        .filter((c) => CODE_CHARS.test(c))
        .join("");
    return mapped.slice(-CODE_LENGTH);
}

const formatCode = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? "";

export function ListenTogetherDialog() {
    const { t } = useTranslation();
    const open = useListenTogetherStore((state) => state.dialogOpen);
    const setOpen = useListenTogetherStore((state) => state.setDialogOpen);
    const status = useListenTogetherStore((state) => state.status);

    const inSession = status.active && status.phase !== "failed";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[460px] gap-0 p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <Headphones className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <DialogTitle>{t("listenTogether.title")}</DialogTitle>
                                <DialogDescription className="mt-0.5">
                                    {inSession ? <SessionSubtitle status={status} /> : t("listenTogether.subtitle")}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {inSession ? <SessionView status={status} /> : <StartView status={status} />}
            </DialogContent>
        </Dialog>
    );
}

function SessionSubtitle({ status }: { status: ListenTogetherStatus }) {
    const { t } = useTranslation();
    if (status.phase === "reconnecting") return <>{t("listenTogether.reconnecting")}</>;
    if (status.phase === "connecting" || status.phase === "starting") return <>{t("listenTogether.connecting")}</>;
    if (status.role === "host") return <>{t("listenTogether.hostingSubtitle")}</>;
    return <>{t("listenTogether.listeningWith", { name: status.hostName ?? "" })}</>;
}

// ---------------------------------------------------------------------------------------

function StartView({ status }: { status: ListenTogetherStatus }) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState<"host" | "join" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const codeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        void listenTogether.displayName().then((saved) => { if (!cancelled && saved) setName((current) => current || saved); });
        return () => { cancelled = true; };
    }, []);

    // Why the last session ended, if it ended by itself.
    const notice = status.phase === "ended" && status.endReason && status.endReason !== "left" ? status.endReason : null;

    const host = async () => {
        setBusy("host");
        setError(null);
        const result = await listenTogether.host(name.trim());
        setBusy(null);
        if (!result.ok) setError(result.error ?? t("listenTogether.genericError"));
    };

    const join = async (event?: FormEvent) => {
        event?.preventDefault();
        if (code.length !== CODE_LENGTH || busy) return;
        setBusy("join");
        setError(null);
        const result = await listenTogether.join(code, name.trim());
        setBusy(null);
        if (!result.ok) {
            setError(result.error ?? t("listenTogether.genericError"));
            codeRef.current?.focus();
        }
    };

    const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        setCode(normalizeCode(event.clipboardData.getData("text")));
        setError(null);
    };

    return (
        <div className="flex flex-col gap-4 px-6 pb-6">
            {notice && (
                <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{notice}</span>
                </div>
            )}

            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t("listenTogether.yourName")}</span>
                <Input
                    value={name}
                    maxLength={32}
                    placeholder={t("listenTogether.namePlaceholder")}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!!busy}
                />
            </label>

            <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                    <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">{t("listenTogether.hostTitle")}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t("listenTogether.hostDescription")}</p>
                    </div>
                </div>
                <Button className="mt-3 w-full" onClick={host} disabled={!!busy}>
                    {busy === "host" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {busy === "host" ? t("listenTogether.starting") : t("listenTogether.hostButton")}
                </Button>
            </div>

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                {t("listenTogether.or")}
                <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={join} className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t("listenTogether.joinTitle")}</span>
                <div className="flex gap-2">
                    <Input
                        ref={codeRef}
                        value={formatCode(code)}
                        onChange={(event) => { setCode(normalizeCode(event.target.value)); setError(null); }}
                        onPaste={onPaste}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        spellCheck={false}
                        autoCapitalize="characters"
                        autoComplete="off"
                        aria-label={t("listenTogether.codeLabel")}
                        className="font-mono tracking-wider uppercase"
                        disabled={!!busy}
                    />
                    <Button type="submit" variant="secondary" disabled={code.length !== CODE_LENGTH || !!busy} className="shrink-0">
                        {busy === "join" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        <span className="ml-1.5">{busy === "join" ? t("listenTogether.joining") : t("listenTogether.joinButton")}</span>
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {code.length > 0 && code.length < CODE_LENGTH
                        ? t("listenTogether.codeProgress", { count: code.length, total: CODE_LENGTH })
                        : t("listenTogether.joinDescription")}
                </p>
            </form>

            {error && (
                <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------------------

function SessionView({ status }: { status: ListenTogetherStatus }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const isHost = status.role === "host";
    const participants = status.participants ?? [];

    const copy = async () => {
        if (!status.code) return;
        try {
            await navigator.clipboard.writeText(status.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        }
        catch {
            // Clipboard refused; the code is selectable anyway.
        }
    };

    const leave = async () => {
        setLeaving(true);
        await listenTogether.leave();
        setLeaving(false);
    };

    const banner = useMemo(() => {
        if (status.phase === "reconnecting") return { tone: "warn", text: t("listenTogether.reconnectingBanner") };
        if (status.current?.blocked) return { tone: "warn", text: t("listenTogether.unavailableBanner", { title: status.current.title ?? "" }) };
        if (status.current?.substituted) return { tone: "info", text: t("listenTogether.substitutedBanner") };
        return null;
    }, [status, t]);

    return (
        <div className="flex flex-col gap-4 px-6 pb-6">
            {isHost && status.code && (
                <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{t("listenTogether.shareCode")}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <code className="flex-1 select-all rounded-md bg-background px-3 py-2 text-center font-mono text-lg font-semibold tracking-[0.15em]">
                            {status.code}
                        </code>
                        <Button variant="outline" size="icon" onClick={copy} aria-label={t("listenTogether.copy")}>
                            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("listenTogether.shareHint")}</p>
                </div>
            )}

            {banner && (
                <div className={clsx(
                    "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
                    banner.tone === "warn" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary",
                )}>
                    {banner.tone === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{banner.text}</span>
                </div>
            )}

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {t("listenTogether.listeners", { count: participants.length })}
                    </span>
                    {!isHost && status.route && (
                        <span className="text-xs text-muted-foreground">
                            {status.route === "direct" ? t("listenTogether.direct") : t("listenTogether.relayed")}
                            {status.rtt != null ? ` · ${Math.round(status.rtt)} ms` : ""}
                        </span>
                    )}
                </div>
                <ul className="max-h-56 overflow-y-auto rounded-lg border divide-y">
                    {participants.length === 0 && (
                        <li className="px-3 py-3 text-sm text-muted-foreground">{t("listenTogether.waitingForPeople")}</li>
                    )}
                    {participants.map((participant) => <ParticipantRow key={participant.id} participant={participant} />)}
                    {isHost && participants.length === 1 && (
                        <li className="px-3 py-3 text-xs text-muted-foreground">{t("listenTogether.nobodyYet")}</li>
                    )}
                </ul>
            </div>

            <Button variant={isHost ? "destructive" : "outline"} onClick={leave} disabled={leaving}>
                {leaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {isHost ? t("listenTogether.endSession") : t("listenTogether.leaveSession")}
            </Button>
        </div>
    );
}

const syncLabels: Record<string, { key: string, tone: "good" | "busy" | "bad" | "idle" }> = {
    synced: { key: "listenTogether.sync.synced", tone: "good" },
    syncing: { key: "listenTogether.sync.syncing", tone: "busy" },
    starting: { key: "listenTogether.sync.syncing", tone: "busy" },
    buffering: { key: "listenTogether.sync.buffering", tone: "busy" },
    struggling: { key: "listenTogether.sync.struggling", tone: "bad" },
    unavailable: { key: "listenTogether.sync.unavailable", tone: "bad" },
    paused: { key: "listenTogether.sync.paused", tone: "idle" },
    waiting: { key: "listenTogether.sync.waiting", tone: "idle" },
    offline: { key: "listenTogether.sync.reconnecting", tone: "bad" },
};

function ParticipantRow({ participant }: { participant: ListenTogetherParticipant }) {
    const { t } = useTranslation();
    const label = participant.state === "reconnecting"
        ? syncLabels.offline
        : syncLabels[participant.sync] ?? syncLabels.waiting;
    const initial = participant.name.trim().charAt(0).toUpperCase() || "?";
    const drift = participant.drift != null && label.tone !== "idle" ? `${participant.drift > 0 ? "+" : ""}${Math.round(participant.drift)} ms` : null;

    return (
        <li className="flex items-center gap-3 px-3 py-2">
            <div className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                participant.host ? "bg-primary/20 text-primary" : "bg-muted text-foreground",
            )}>
                {initial}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {participant.name}
                    {participant.you && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({t("listenTogether.you")})</span>}
                    {participant.host && <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">{t("listenTogether.host")}</span>}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground" title={drift ?? undefined}>
                    <span className={clsx(
                        "h-1.5 w-1.5 rounded-full",
                        label.tone === "good" && "bg-emerald-500",
                        label.tone === "busy" && "bg-amber-500",
                        label.tone === "bad" && "bg-red-500",
                        label.tone === "idle" && "bg-yellow-500",
                    )} />
                    {t(label.key)}
                    {!participant.host && participant.route ? <span>· {participant.route === "direct" ? t("listenTogether.direct") : t("listenTogether.relayed")}</span> : null}
                </p>
            </div>
        </li>
    );
}

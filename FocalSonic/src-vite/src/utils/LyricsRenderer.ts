/**
 * LyricsRenderer - Imperative DOM-based lyrics renderer
 * Updates DOM directly without React rerenders for optimal performance
 */

import { LyricChannel } from "@/types/serverConfig";
import { hasNonLatin } from "./lyricEligibility";
import { ParsedLyricLine, ParsedLyrics, ParsedLyricWord, findActiveLine } from "./lrcParser";

export interface LyricsRendererOptions {
    leftAlign?: boolean;
    small?: boolean;
    oneLine?: boolean;
    enableBlur?: boolean;
    enableGlow?: boolean;
    onSeek?: (timeMs: number) => void;
    // Ordered channels to display. Index 0 = large slot, 1..2 = small slots.
    selectedChannels?: LyricChannel[];
    // Channels currently being fetched from an external API - shown as skeletons.
    loadingChannels?: Set<LyricChannel>;
}

// One rendered channel within a line (the large slot or a small sub-slot).
interface SlotElement {
    channel: LyricChannel;
    container: HTMLElement;
    wordSpans: HTMLSpanElement[];
    isLarge: boolean;
    isSkeleton: boolean;
}

interface LineElement {
    container: HTMLElement;
    slots: SlotElement[];
    line: ParsedLyricLine;
}

/**
 * Imperative lyrics renderer that manipulates DOM directly
 * instead of relying on React rerenders
 */
export class LyricsRenderer {
    private container: HTMLElement | null = null;
    private lyricsContainer: HTMLElement | null = null;
    private lineElements: LineElement[] = [];
    private lyrics: ParsedLyrics;
    private options: LyricsRendererOptions;
    private currentActiveIndex: number = -1;
    private lastAutoScrollTime: number = 0;
    private autoScrollCooldown: number = 100; // ms between auto-scroll updates
    private userScrollTime: number = 0; // When user last scrolled
    private userScrollRecoveryDelay: number = 500; // ms to wait before recovering auto-scroll
    private isUserScrolling: boolean = false;
    private isProgrammaticScroll: boolean = false; // Flag to ignore programmatic scroll events
    private programmaticScrollTimeout: number | null = null;
    private scrollHandler: (() => void) | null = null;

    constructor(lyrics: ParsedLyrics, options: LyricsRendererOptions = {}) {
        this.lyrics = lyrics;
        this.options = options;
    }

    /**
     * Mount the renderer to a container element
     */
    mount(container: HTMLElement): void {
        this.container = container;
        this.createDOM();
    }

    /**
     * Create all DOM elements for lyrics
     */
    private createDOM(): void {
        if (!this.container) return;

        // Clear existing content
        this.container.innerHTML = "";
        this.lineElements = [];

        // Create scrollable lyrics container
        this.lyricsContainer = document.createElement("div");
        this.lyricsContainer.id = `sync-lyrics-box-${this.options.leftAlign ? "left" : "center"}`;
        this.lyricsContainer.className = this.buildContainerClasses();

        // Add vertical space at start
        if (!this.options.oneLine) {
            const spacer = document.createElement("div");
            spacer.style.height = "40vh";
            this.lyricsContainer.appendChild(spacer);
        }

        // Create line elements
        for (const line of this.lyrics.lines) {
            const lineEl = this.createLineElement(line);
            this.lineElements.push(lineEl);
            this.lyricsContainer.appendChild(lineEl.container);
        }

        // Add vertical space at end
        if (!this.options.oneLine) {
            const spacer = document.createElement("div");
            spacer.style.height = "40vh";
            this.lyricsContainer.appendChild(spacer);
        }

        this.container.appendChild(this.lyricsContainer);

        // Add scroll event listener to detect user scrolling
        // Ignore scroll events triggered by programmatic scrollTo()
        this.scrollHandler = () => {
            if (this.isProgrammaticScroll) {
                return; // Ignore programmatic scroll
            }
            this.userScrollTime = performance.now();
            this.isUserScrolling = true;
        };
        this.lyricsContainer.addEventListener("scroll", this.scrollHandler, { passive: true });
    }

    /**
     * Build CSS classes for the lyrics container
     */
    private buildContainerClasses(): string {
        const classes = ["z-40", "h-full"];

        // Safari doesn't handle scroll-smooth well with frequent updates
        if (!this.isSafari()) {
            classes.push("scroll-smooth");
        }

        if (this.options.oneLine) {
            classes.push("overflow-hidden", "pt-4", "flex", "flex-col", "items-center", "justify-center");
        } else {
            classes.push("overflow-y-auto", "overflow-x-hidden");
        }

        return classes.join(" ");
    }

    /**
     * Check if browser is Safari
     */
    private isSafari(): boolean {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    /**
     * Resolve the word-level data for a given channel on a line.
     */
    private getChannelWords(line: ParsedLyricLine, channel: LyricChannel): ParsedLyricWord[] {
        switch (channel) {
            case "transliteration": return line.transliterationWords;
            case "translation": return line.translationWords;
            case "original":
            default: return line.words;
        }
    }

    /**
     * Whether a line should show a loading skeleton for a channel that has no
     * data yet. Transliteration only applies to non-Latin lines; translation to
     * any non-empty line; original never loads.
     */
    private lineExpectsChannel(line: ParsedLyricLine, channel: LyricChannel): boolean {
        if (channel === "transliteration") return hasNonLatin(line.content);
        if (channel === "translation") return line.content.trim().length > 0;
        return false;
    }

    /**
     * Build a skeleton placeholder span sized from the line so it roughly
     * matches the eventual text width.
     */
    private createSkeletonSpan(line: ParsedLyricLine): HTMLSpanElement {
        const span = document.createElement("span");
        span.className = "lyric-skeleton";
        const chars = Math.max(4, line.content.replace(/\s+/g, " ").trim().length);
        span.style.width = `${Math.min(90, 18 + chars * 1.2)}%`;
        return span;
    }

    /**
     * Normalized text of a channel's words for duplicate detection - whitespace
     * and case are ignored so word-synced and line-level copies of the same line
     * compare equal despite different tokenization.
     */
    private normalizeLineText(words: ParsedLyricWord[]): string {
        return words.map((w) => w.text).join("").replace(/\s+/g, "").toLowerCase();
    }

    private createWordSpan(word: ParsedLyricWord): HTMLSpanElement {
        const span = document.createElement("span");
        span.className = this.buildWordClasses(false);
        span.dataset.time = String(word.time);
        span.dataset.duration = String(word.duration);
        span.textContent = word.text;
        return span;
    }

    /**
     * Create DOM elements for a single lyric line.
     *
     * Channels are placed by selection order, but only channels that actually
     * have content for this line are shown. The first channel *with content*
     * becomes the large slot (the line `<p>` itself) - so if the preferred
     * primary channel is blank on this line, the next one is promoted rather
     * than leaving a large empty slot above the small ones. Remaining channels
     * become small sub-lyric `<p>` children.
     */
    private createLineElement(line: ParsedLyricLine): LineElement {
        const p = document.createElement("p");
        p.className = this.buildLineClasses(line, false, false);
        p.dataset.lineId = line.id;
        p.dataset.startTime = String(line.startTime);

        // Add click handler for seeking
        if (this.options.onSeek) {
            p.style.cursor = "pointer";
            p.addEventListener("click", () => {
                this.options.onSeek?.(line.startTime);
            });
        }

        const channels = this.options.selectedChannels?.length ? this.options.selectedChannels : ["original" as LyricChannel];

        // Keep only channels that have something to render on this line
        // (real words, or a skeleton for a channel that's still loading).
        const renderable = channels
            .map((channel) => {
                const words = this.getChannelWords(line, channel);
                const hasWords = words.length > 0;
                const isLoading = this.options.loadingChannels?.has(channel) ?? false;
                const showSkeleton = !hasWords && isLoading && this.lineExpectsChannel(line, channel);
                return { channel, words, hasWords, showSkeleton };
            })
            .filter((entry) => entry.hasWords || entry.showSkeleton);

        // Timing-aware duplicate removal: when two channels carry the same text
        // for this line, keep only the copy with the most word-level timing (so a
        // word-synced version wins over a line-level one), regardless of channel
        // priority. Ties keep the higher-priority (earlier) channel.
        const bestByText = new Map<string, number>();
        renderable.forEach((entry, i) => {
            if (!entry.hasWords) return;
            const key = this.normalizeLineText(entry.words);
            if (!key) return;
            const best = bestByText.get(key);
            if (best === undefined || entry.words.length > renderable[best].words.length) {
                bestByText.set(key, i);
            }
        });

        const visible = renderable.filter((entry, i) => {
            if (!entry.hasWords) return true; // skeletons never dedupe
            const key = this.normalizeLineText(entry.words);
            if (!key) return true;
            return bestByText.get(key) === i;
        });

        const slots: SlotElement[] = [];

        visible.forEach((entry, index) => {
            const isLarge = index === 0; // first channel WITH content becomes the large slot
            const slotContainer = isLarge ? p : document.createElement("p");

            const wordSpans: HTMLSpanElement[] = [];
            if (entry.hasWords) {
                for (const word of entry.words) {
                    const span = this.createWordSpan(word);
                    wordSpans.push(span);
                    slotContainer.appendChild(span);
                }
            } else if (entry.showSkeleton) {
                slotContainer.appendChild(this.createSkeletonSpan(line));
            }

            if (!isLarge) {
                p.appendChild(slotContainer);
            }

            slots.push({ channel: entry.channel, container: slotContainer, wordSpans, isLarge, isSkeleton: entry.showSkeleton });
        });

        // Assign classes once the final slot count is known (only the last slot
        // gets the block-separating bottom margin).
        this.applySlotClasses(slots, line, false);

        return { container: p, slots, line };
    }

    /**
     * (Re)apply line/slot CSS classes, marking the last slot so only it carries
     * the large inter-line bottom margin.
     */
    private applySlotClasses(slots: SlotElement[], line: ParsedLyricLine, active: boolean): void {
        const lastIndex = slots.length - 1;
        slots.forEach((slot, i) => {
            slot.container.className = this.buildLineClasses(line, active, !slot.isLarge, i === lastIndex);
        });
    }

    /**
     * Build CSS classes for a lyric line
     */
    private buildLineClasses(line: ParsedLyricLine, active: boolean, isSubLyric: boolean = false, isLastSlot: boolean = true): string {
        const classes = [
            "lyric-line",
            "drop-shadow-lg",
            "z-40",
            "cursor-pointer",
            "hover:opacity-100",
            "duration-700",
            "transition-[opacity,transform,filter]",
            "motion-reduce:transition-none",
            "ease-long",
            "xxs:leading-normal",
        ];

        if (this.options.leftAlign) {
            classes.push("text-left");
        }

        if (active) {
            classes.push("lyric-line-active");
        }

        if (isSubLyric) {
            classes.push("lyric-subline");
        }
        else {
            classes.push("lyric-mainline");
        }

        if (active && !isSubLyric) {
            classes.push("opacity-100", "scale-110", "font-bold");
            if (this.options.leftAlign) {
                classes.push("translate-x-[7%]");
            }
        } else {
            classes.push("opacity-60");
        }

        // Margin classes based on line type. Only the LAST slot of a line carries
        // the large bottom margin that separates whole line-blocks; inner sub-slots
        // (a second/third stacked alternate) stay tight against each other.
        if (!isSubLyric && !this.options.small) {
            classes.push("my-10", "!2xl:my-30", "!xxs:my-5", "xxs:text-[18px]", "2xl:my-20", "!xxs:my-0");
        } else if (!isSubLyric && this.options.small) {
            classes.push("text-[18px]", "!my-0", "!mt-8", "leading-normal");
        } else if (isSubLyric && !this.options.small) {
            classes.push("text-xl", "2xl:text-3xl", "xxs:text-xs", "opacity-100", "mt-0");
            classes.push(...(isLastSlot ? ["mb-10", "!2xl:mb-30", "xxs:mb-2"] : ["mb-1", "xxs:mb-0.5"]));
        } else if (isSubLyric && this.options.small) {
            classes.push("!text-[12px]", "leading-normal", isLastSlot ? "!mb-2" : "!mb-0.5");
        }

        return classes.join(" ");
    }

    /**
     * Build CSS classes for a word span
     */
    private buildWordClasses(active: boolean): string {
        const classes = ["lyric-wipe"];

        if (active) {
            classes.push("lyric-wipe-active");
        }

        if (!this.options.enableGlow) {
            classes.push("lyric-glow-disabled");
        }

        return classes.join(" ");
    }

    /**
     * Update the renderer with current timestamp
     * This is called every frame via requestAnimationFrame
     */
    update(timestampMs: number): void {
        const timestampSec = timestampMs / 1000;
        const newActiveIndex = findActiveLine(this.lyrics, timestampMs);

        // Handle one-line mode - only show active line
        if (this.options.oneLine) {
            this.updateOneLineMode(newActiveIndex, timestampSec);
            return;
        }

        // Update line states
        for (let i = 0; i < this.lineElements.length; i++) {
            const { container, slots, line } = this.lineElements[i];
            const isActive = i === newActiveIndex;

            // Update line/slot classes if active state changed
            if (i === newActiveIndex && this.currentActiveIndex !== newActiveIndex) {
                this.applySlotClasses(slots, line, true);
            } else if (i === this.currentActiveIndex && this.currentActiveIndex !== newActiveIndex) {
                this.applySlotClasses(slots, line, false);
            }

            // Update blur based on distance from active line
            this.updateLineBlur(container, line, i, newActiveIndex, isActive);

            // Update word highlights for every slot (skeleton slots have no spans)
            for (const slot of slots) {
                if (slot.wordSpans.length > 0) {
                    this.updateWordHighlights(slot.wordSpans, timestampSec, isActive);
                }
            }
        }

        // Scroll to active line if changed or recovering from user scroll
        const now = performance.now();
        const recoveryExpired = now - this.userScrollTime > this.userScrollRecoveryDelay;
        const shouldAutoScroll = !this.isUserScrolling || recoveryExpired;

        // Track if we're recovering from user scroll this frame
        const isRecovering = this.isUserScrolling && recoveryExpired;

        if (isRecovering) {
            // Recovering from user scroll - clear flag and force scroll to current line
            this.isUserScrolling = false;
            if (newActiveIndex >= 0) {
                this.scrollToLine(newActiveIndex);
            }
        } else if (shouldAutoScroll && newActiveIndex >= 0 &&
            (newActiveIndex !== this.currentActiveIndex || this.currentActiveIndex === -1)) {
            // Normal auto-scroll on line change
            this.scrollToLine(newActiveIndex);
        }

        this.currentActiveIndex = newActiveIndex;
    }



    /**
     * Update blur effect based on distance from active line
     */
    private updateLineBlur(
        container: HTMLElement,
        line: ParsedLyricLine,
        lineIndex: number,
        activeIndex: number,
        isActive: boolean
    ): void {
        if (!this.options.enableBlur || isActive || this.options.small) {
            container.style.filter = "";
            return;
        }

        // Calculate distance for blur (only count main lines)
        let distance = Math.abs(lineIndex - activeIndex);
        if (distance > 5) distance = 5;

        container.style.filter = `blur(${distance * 1.2}px)`;
    }

    /**
     * Update word-level highlights for ELRC
     */
    private updateWordHighlights(
        wordSpans: HTMLSpanElement[],
        timestampSec: number,
        isLineActive: boolean
    ): void {
        for (const span of wordSpans) {
            const wordTime = parseFloat(span.dataset.time || "0");
            const duration = parseFloat(span.dataset.duration || "0.3");
            const isWordActive = timestampSec >= wordTime - 0.2;

            // Update class for word highlight animation
            const hasActiveClass = span.classList.contains("lyric-wipe-active");

            if (isWordActive && !hasActiveClass) {
                span.classList.add("lyric-wipe-active");
                span.style.transitionDuration = `${duration * 2}s`;
            } else if (!isWordActive && hasActiveClass) {
                span.classList.remove("lyric-wipe-active");
            }
        }
    }

    /**
     * Handle one-line mode where only active line is visible
     */
    private updateOneLineMode(activeIndex: number, timestampSec: number): void {
        for (let i = 0; i < this.lineElements.length; i++) {
            const { container, slots, line } = this.lineElements[i];
            const isActive = i === activeIndex;

            // Show/hide based on active state
            container.style.display = isActive ? "" : "none";

            if (isActive) {
                this.applySlotClasses(slots, line, true);
                for (const slot of slots) {
                    if (slot.wordSpans.length > 0) {
                        this.updateWordHighlights(slot.wordSpans, timestampSec, true);
                    }
                }
            }
        }
    }

    /**
     * Scroll to center the active line
     */
    private scrollToLine(lineIndex: number): void {
        if (!this.lyricsContainer || this.options.oneLine) return;

        const now = performance.now();
        if (now - this.lastAutoScrollTime < this.autoScrollCooldown) return;
        this.lastAutoScrollTime = now;

        const lineEl = this.lineElements[lineIndex]?.container;
        if (!lineEl) return;

        // Calculate scroll position to center the line
        const containerRect = this.lyricsContainer.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const scrollTop = this.lyricsContainer.scrollTop;

        const targetScroll = scrollTop + lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);

        // Set flag to ignore scroll events triggered by this programmatic scroll
        this.isProgrammaticScroll = true;

        // Clear any existing timeout
        if (this.programmaticScrollTimeout !== null) {
            clearTimeout(this.programmaticScrollTimeout);
        }

        this.lyricsContainer.scrollTo({
            top: targetScroll,
            behavior: this.isSafari() ? "auto" : "smooth",
        });

        // Clear the flag after scroll completes (use longer timeout for smooth scroll)
        this.programmaticScrollTimeout = window.setTimeout(() => {
            this.isProgrammaticScroll = false;
            this.programmaticScrollTimeout = null;
        }, this.isSafari() ? 50 : 400);
    }

    /**
     * Update options (e.g., when theme settings change)
     */
    updateOptions(options: Partial<LyricsRendererOptions>): void {
        const needsRebuild =
            options.leftAlign !== undefined && options.leftAlign !== this.options.leftAlign ||
            options.small !== undefined && options.small !== this.options.small ||
            options.oneLine !== undefined && options.oneLine !== this.options.oneLine;

        this.options = { ...this.options, ...options };

        if (needsRebuild && this.container) {
            this.createDOM();
            this.currentActiveIndex = -1;
        }
    }

    /**
     * Force scroll to a specific line (e.g., after user interaction)
     */
    forceScrollToLine(lineIndex: number): void {
        this.lastAutoScrollTime = 0; // Reset cooldown
        this.isUserScrolling = false; // Reset user scroll state
        this.scrollToLine(lineIndex);
    }

    /**
     * Reset the renderer state (call when switching songs)
     */
    reset(): void {
        this.currentActiveIndex = -1;
        this.lastAutoScrollTime = 0;
        this.userScrollTime = 0;
        this.isUserScrolling = false;

        // Reset all line states to inactive
        for (const { container, slots, line } of this.lineElements) {
            container.style.filter = "";
            this.applySlotClasses(slots, line, false);

            for (const slot of slots) {
                for (const span of slot.wordSpans) {
                    span.classList.remove("lyric-wipe-active");
                }
            }
        }

        // Scroll to top
        if (this.lyricsContainer) {
            this.lyricsContainer.scrollTop = 0;
        }
    }

    /**
     * Clean up and destroy the renderer
     */
    destroy(): void {
        // Clear programmatic scroll timeout
        if (this.programmaticScrollTimeout !== null) {
            clearTimeout(this.programmaticScrollTimeout);
            this.programmaticScrollTimeout = null;
        }

        // Remove scroll event listener
        if (this.lyricsContainer && this.scrollHandler) {
            this.lyricsContainer.removeEventListener("scroll", this.scrollHandler);
            this.scrollHandler = null;
        }

        if (this.container) {
            this.container.innerHTML = "";
        }
        this.lineElements = [];
        this.container = null;
        this.lyricsContainer = null;
        this.currentActiveIndex = -1;
    }
}

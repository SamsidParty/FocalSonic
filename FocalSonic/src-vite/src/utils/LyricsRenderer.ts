/**
 * LyricsRenderer - Imperative DOM-based lyrics renderer
 * Updates DOM directly without React rerenders for optimal performance
 */

import { ParsedLyricLine, ParsedLyrics, findActiveLine } from "./lrcParser";

export interface LyricsRendererOptions {
    leftAlign?: boolean;
    small?: boolean;
    oneLine?: boolean;
    enableBlur?: boolean;
    enableGlow?: boolean;
    onSeek?: (timeMs: number) => void;
}

interface LineElement {
    container: HTMLElement;
    wordSpans: HTMLSpanElement[];
    subLyricContainer: HTMLElement | null;
    subLyricWordSpans: HTMLSpanElement[];
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
    private lastScrollTime: number = 0;
    private scrollCooldown: number = 100; // ms between scroll updates

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
     * Create DOM elements for a single lyric line
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

        const wordSpans: HTMLSpanElement[] = [];

        // Create word spans for main lyrics (ELRC)
        for (let i = 0; i < line.words.length; i++) {
            const word = line.words[i];
            const span = document.createElement("span");
            span.className = this.buildWordClasses(false);
            span.dataset.time = String(word.time);
            span.dataset.duration = String(word.duration);
            span.textContent = word.text;
            wordSpans.push(span);
            p.appendChild(span);
        }

        // Create sub-lyrics as a child element if present
        let subLyricContainer: HTMLElement | null = null;
        const subLyricWordSpans: HTMLSpanElement[] = [];

        if (line.altContent && line.altWords.length > 0) {
            subLyricContainer = document.createElement("p");
            subLyricContainer.className = this.buildLineClasses(line, false, true);

            for (let i = 0; i < line.altWords.length; i++) {
                const word = line.altWords[i];
                const span = document.createElement("span");
                span.className = this.buildWordClasses(false);
                span.dataset.time = String(word.time);
                span.dataset.duration = String(word.duration);
                span.textContent = word.text;
                subLyricWordSpans.push(span);
                subLyricContainer.appendChild(span);
            }

            // Append sub-lyric as child of parent line
            p.appendChild(subLyricContainer);
        }

        return { container: p, wordSpans, subLyricContainer, subLyricWordSpans, line };
    }

    /**
     * Build CSS classes for a lyric line
     */
    private buildLineClasses(line: ParsedLyricLine, active: boolean, isSubLyric: boolean = false): string {
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

        // Margin classes based on line type
        if (!isSubLyric && !this.options.small) {
            classes.push("my-10", "!2xl:my-30", "!xxs:my-5", "xxs:text-[18px]", "2xl:my-20", "!xxs:my-0");
        } else if (!isSubLyric && this.options.small) {
            classes.push("text-[18px]", "!my-0", "!mt-8", "leading-normal");
        } else if (isSubLyric && !this.options.small) {
            classes.push("text-xl", "2xl:text-3xl", "xxs:text-xs", "opacity-100", "mt-0", "mb-10", "!2xl:mb-30", "xxs:mb-2");
        } else if (isSubLyric && this.options.small) {
            classes.push("!text-[12px]", "!mb-2", "leading-normal");
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
            const { container, wordSpans, subLyricContainer, subLyricWordSpans, line } = this.lineElements[i];
            const isActive = i === newActiveIndex;

            // Update line classes if active state changed
            if (i === newActiveIndex && this.currentActiveIndex !== newActiveIndex) {
                container.className = this.buildLineClasses(line, true, false);
                if (subLyricContainer) {
                    subLyricContainer.className = this.buildLineClasses(line, true, true);
                }
            } else if (i === this.currentActiveIndex && this.currentActiveIndex !== newActiveIndex) {
                container.className = this.buildLineClasses(line, false, false);
                if (subLyricContainer) {
                    subLyricContainer.className = this.buildLineClasses(line, false, true);
                }
            }

            // Update blur based on distance from active line
            this.updateLineBlur(container, line, i, newActiveIndex, isActive);

            // Update word highlights for main lyrics
            this.updateWordHighlights(wordSpans, timestampSec, isActive);

            // Update word highlights for sub-lyrics
            if (subLyricWordSpans.length > 0) {
                this.updateWordHighlights(subLyricWordSpans, timestampSec, isActive);
            }
        }

        // Scroll to active line if changed
        if (newActiveIndex !== this.currentActiveIndex && newActiveIndex >= 0) {
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
            const { container, wordSpans, subLyricContainer, subLyricWordSpans, line } = this.lineElements[i];
            const isActive = i === activeIndex;

            // Show/hide based on active state
            container.style.display = isActive ? "" : "none";

            if (isActive) {
                container.className = this.buildLineClasses(line, true, false);
                this.updateWordHighlights(wordSpans, timestampSec, true);

                // Update sub-lyrics too
                if (subLyricContainer) {
                    subLyricContainer.className = this.buildLineClasses(line, true, true);
                }
                if (subLyricWordSpans.length > 0) {
                    this.updateWordHighlights(subLyricWordSpans, timestampSec, true);
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
        if (now - this.lastScrollTime < this.scrollCooldown) return;
        this.lastScrollTime = now;

        const lineEl = this.lineElements[lineIndex]?.container;
        if (!lineEl) return;

        // Calculate scroll position to center the line
        const containerRect = this.lyricsContainer.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const scrollTop = this.lyricsContainer.scrollTop;

        const targetScroll = scrollTop + lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);

        this.lyricsContainer.scrollTo({
            top: targetScroll,
            behavior: this.isSafari() ? "auto" : "smooth",
        });
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
        this.lastScrollTime = 0; // Reset cooldown
        this.scrollToLine(lineIndex);
    }

    /**
     * Clean up and destroy the renderer
     */
    destroy(): void {
        if (this.container) {
            this.container.innerHTML = "";
        }
        this.lineElements = [];
        this.container = null;
        this.lyricsContainer = null;
        this.currentActiveIndex = -1;
    }
}

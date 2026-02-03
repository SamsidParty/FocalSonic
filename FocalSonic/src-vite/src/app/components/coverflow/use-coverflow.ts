import { SingleAlbum } from "@/types/responses/album";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseCoverflowOptions {
    items: SingleAlbum[];
    visibleCount?: number;
    initialIndex?: number;
}

interface UseCoverflowReturn {
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    goToNext: () => void;
    goToPrevious: () => void;
    goToIndex: (index: number) => void;
    getVisibleItems: () => { item: SingleAlbum; position: number; virtualIndex: number }[];
    containerRef: React.RefObject<HTMLDivElement>;
    isAnimating: boolean;
}

export function useCoverflow({
    items,
    visibleCount = 7,
    initialIndex = 0,
}: UseCoverflowOptions): UseCoverflowReturn {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wheelAccumulatorRef = useRef(0);
    const lastWheelTimeRef = useRef(0);

    const itemCount = items.length;

    // Normalize index to handle infinite loop
    const normalizeIndex = useCallback((index: number): number => {
        if (itemCount === 0) return 0;
        return ((index % itemCount) + itemCount) % itemCount;
    }, [itemCount]);

    const goToIndex = useCallback((index: number) => {
        setIsAnimating(true);
        setCurrentIndex(normalizeIndex(index));
        
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        
        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
        }, 400);
    }, [isAnimating, normalizeIndex]);

    const goToNext = useCallback(() => {
        goToIndex(currentIndex + 1);
    }, [currentIndex, goToIndex]);

    const goToPrevious = useCallback(() => {
        goToIndex(currentIndex - 1);
    }, [currentIndex, goToIndex]);

    // Get visible items with their positions relative to center
    const getVisibleItems = useCallback(() => {
        if (itemCount === 0) return [];

        const halfVisible = Math.floor(visibleCount / 2);
        const visibleItems: { item: SingleAlbum; position: number; virtualIndex: number }[] = [];

        for (let offset = -halfVisible; offset <= halfVisible; offset++) {
            const virtualIndex = normalizeIndex(currentIndex + offset);
            visibleItems.push({
                item: items[virtualIndex],
                position: offset,
                virtualIndex,
            });
        }

        return visibleItems;
    }, [items, currentIndex, visibleCount, itemCount, normalizeIndex]);

    // Handle wheel scrolling with momentum and accumulation
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            
            const now = Date.now();
            const timeDelta = now - lastWheelTimeRef.current;
            
            // Reset accumulator if too much time has passed
            if (timeDelta > 200) {
                wheelAccumulatorRef.current = 0;
            }
            
            lastWheelTimeRef.current = now;
            
            // Accumulate scroll delta
            wheelAccumulatorRef.current += e.deltaY + e.deltaX;
            
            // Threshold to trigger navigation (adjust for sensitivity)
            const threshold = 50;
            
            if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
                if (wheelAccumulatorRef.current > 0) {
                    goToNext();
                } else {
                    goToPrevious();
                }
                wheelAccumulatorRef.current = 0;
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener("wheel", handleWheel);
        };
    }, [goToNext, goToPrevious]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current?.contains(document.activeElement)) return;
            
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    goToPrevious();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    goToNext();
                    break;
                case "Home":
                    e.preventDefault();
                    goToIndex(0);
                    break;
                case "End":
                    e.preventDefault();
                    goToIndex(itemCount - 1);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrevious, goToIndex, itemCount]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    return {
        currentIndex,
        setCurrentIndex: goToIndex,
        goToNext,
        goToPrevious,
        goToIndex,
        getVisibleItems,
        containerRef,
        isAnimating,
    };
}

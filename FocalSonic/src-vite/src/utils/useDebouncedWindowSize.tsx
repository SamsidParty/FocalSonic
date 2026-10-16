import { useEffect, useState } from "react";

// A minimized window reports innerWidth/innerHeight of 0. Reacting to that flips every
// breakpoint and rebuilds anything keyed on viewport size, twice per minimize/restore.
function isMeasurableViewport() {
    return typeof window !== "undefined" && window.innerWidth > 0 && window.innerHeight > 0;
}

function readWindowSize(isResizing: boolean) {
    return {
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
        isResizing,
    };
}

function useDebouncedWindowSize(delay = 250) {
    const [windowSize, setWindowSize] = useState(() => readWindowSize(false));

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const handleResize = (isResizing: boolean) => {
            if (!isMeasurableViewport()) return;
            setWindowSize(readWindowSize(isResizing));
        };

        const onResize = () => {
            if (!isMeasurableViewport()) return;

            handleResize(true);

            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handleResize(false), delay);
        };

        window.addEventListener("resize", onResize);
        handleResize(false);

        return () => {
            // Previously removed a different function than it added, leaking a
            // listener per mount that kept firing after unmount.
            window.removeEventListener("resize", onResize);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [delay]);

    return windowSize;
}

export default useDebouncedWindowSize;

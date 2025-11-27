import { useEffect, useState } from "react";

function useDebouncedWindowSize(delay = 250) {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
        isResizing: false,
    });

    useEffect(() => {
    // Handler to update window size on resize
        const handleResize = (isResizing: boolean) => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
                isResizing,
            });
        };

        // Debounce function
        let timeoutId;
        const debouncedHandleResize = () => {
            // Clear the previous timeout if the function is called again
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // Set a new timeout to call handleResize after the delay
            timeoutId = setTimeout(() => handleResize(false), delay);
        };

        // Add event listener
        window.addEventListener("resize", () => {
            handleResize(true);
            debouncedHandleResize();
        });

        // Call once to set initial size in client side for SSR compatibility
        if (typeof window !== "undefined") {
            handleResize(false);
        }

        // Cleanup function to remove event listener on component unmount
        return () => {
            window.removeEventListener("resize", debouncedHandleResize);
            if (timeoutId) { // Also clear timeout on unmount
                clearTimeout(timeoutId);
            }
        };
    }, [delay]); // Re-run effect if the delay changes

    return windowSize;
}

export default useDebouncedWindowSize;

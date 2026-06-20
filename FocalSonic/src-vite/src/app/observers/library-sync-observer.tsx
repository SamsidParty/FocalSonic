import { useLibrarySyncBootstrap } from "@/app/hooks/use-library-sync";

/**
 * Headless observer that boots the local library and triggers a background sync
 * when needed. Renders nothing; mount once near the app root.
 */
export function LibrarySyncObserver() {
    useLibrarySyncBootstrap();
    return null;
}

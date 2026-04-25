import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/fonts.css";
import "@/themes.css";
import "@/index.css";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "react-toastify/dist/ReactToastify.css";

import "@/i18n";

import App from "@/App";

import { persistOptions, queryClient } from "@/lib/queryClient";
import { blockFeatures } from "@/utils/browser";
import { isLinux } from "@/utils/osType";
import { AppWindowProvider } from "./app/hooks/use-app-window";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

if (isLinux) {
    import("@/tw-fix-linux.css");
}

blockFeatures();


function main() {

    createRoot(document.getElementById("root") as HTMLElement).render(
        <StrictMode>
            <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
                <AppWindowProvider>
                    <App />
                </AppWindowProvider>
            </PersistQueryClientProvider>
        </StrictMode>,
    );

}

main();
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/fonts.css";
import "@/themes.css";
import "@/index.css";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "react-toastify/dist/ReactToastify.css";

import "@/i18n";

import App from "@/App";

import { queryClient } from "@/lib/queryClient";
import { blockFeatures } from "@/utils/browser";
import { isLinux } from "@/utils/osType";
import { AppWindowProvider } from "./app/hooks/use-app-window";
import { QueryClientProvider } from "@tanstack/react-query";

if (isLinux) {
    import("@/tw-fix-linux.css");
}

blockFeatures();


function main() {

    createRoot(document.getElementById("root") as HTMLElement).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <AppWindowProvider>
                    <App />
                </AppWindowProvider>
            </QueryClientProvider>
        </StrictMode>,
    );

}

main();
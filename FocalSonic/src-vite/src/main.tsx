import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient, PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/fonts.css";
import "@/themes.css";
import "@/index.css";
import "react-lazy-load-image-component/src/effects/opacity.css";
import "react-toastify/dist/ReactToastify.css";

import "@/i18n";

import App from "@/App";

import { queryCacheStorage, queryClient } from "@/lib/queryClient";
import { blockFeatures } from "@/utils/browser";
import { isLinux } from "@/utils/osType";
import { AppWindowProvider } from "./app/hooks/use-app-window";

if (isLinux) {
    import("@/tw-fix-linux.css");
}

blockFeatures();

const persister = createAsyncStoragePersister({
    storage: queryCacheStorage, 
});

persistQueryClient({ queryClient, persister });

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <PersistQueryClientProvider client={queryClient} persistOptions={{persister}}>
            <AppWindowProvider>
                <App />
            </AppWindowProvider>
        </PersistQueryClientProvider>
    </StrictMode>,
);

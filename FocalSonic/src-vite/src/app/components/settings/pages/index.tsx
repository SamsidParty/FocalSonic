import { useAppRuntimeState } from "@/store/app.store";
import { Appearance } from "./appearance";
import { Integrations } from "./integrations";
import { Language } from "./language";

const pages = {
    appearance: <Appearance />,
    language: <Language />,
    integrations: <Integrations />,
};

export function Pages() {
    const { currentPage } = useAppRuntimeState();

    return pages[currentPage];
}

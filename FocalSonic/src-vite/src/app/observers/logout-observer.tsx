import { useAppRuntimeState } from "@/store/app.store";
import React from "react";
import { LogoutConfirmDialog } from "../components/logout-confirm";

export function LogoutObserver() {
    const { setLogoutDialogState } = useAppRuntimeState();
    const { logoutDialogState } = useAppRuntimeState();

    return (
        <LogoutConfirmDialog
            openDialog={logoutDialogState}
            setOpenDialog={setLogoutDialogState}
        />
    );
}

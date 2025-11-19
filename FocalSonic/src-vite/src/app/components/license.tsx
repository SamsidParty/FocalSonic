import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { ROUTES } from "@/routes/routesList";
import { Check, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { CardDescription, CardHeader, CardTitle } from "./ui/card";

export function LicenseDialog() {
    const { t } = useTranslation();
    const [remainingDays, setRemainingDays] = useState(-1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [price, setPrice] = useState("");
    const location = useLocation();

    const checkLicense = async () => {
        const remainingDays = await window.igniteView?.commandBridge?.licenseCheck();
        console.log("[LICENSE CHECK] Remaining days:", remainingDays);
        setRemainingDays(remainingDays);

        if (remainingDays == 0) {
            setIsDialogOpen(true); // Force open dialog if license expired
            localStorage.hasRemindedLicense = "true";
        }
        else if (remainingDays > 0 && !localStorage.hasRemindedLicense) {
            setIsDialogOpen(true); // Open the dialog just once to remind the user
            localStorage.hasRemindedLicense = "true";
        }
    };

    const checkPrice = async () => {
        if (price) return; // Already fetched
        const foundPrice = await window.igniteView?.commandBridge?.getPremiumPrice();
        setPrice(foundPrice);
    };

    useEffect(() => {
        checkPrice();
        if (location.pathname === ROUTES.LIBRARY.HOME) {
            checkLicense();
        }
    }, [isDialogOpen, location.pathname]);

    return (
        <>
            {
                remainingDays >= 0 && (
                    <>
                        <Button 
                            data-webview-ignore={""}
                            onClick={() => setIsDialogOpen(true)}
                            variant={remainingDays == 0 ? "destructive" : "secondary"}
                            className="rounded-full h-8 w-fit"
                        >
                            {t("license.remainingDays", { count: remainingDays })}
                        </Button>
                    </>
                )
            }
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} >
                <DialogContent
                    className="overflow-hidden p-0 max-h-[600px] max-w-2xl 2xl:max-h-[700px] 2xl:max-w-3xl flex flex-col"
                    aria-describedby={undefined}
                >
                    <CardHeader className="flex flex-none">
                        <CardTitle className="flex flex-row justify-between items-center">
                            {t("license.purchase")}
                        </CardTitle>
                        <CardDescription>{t("license.persuade")}</CardDescription>
                    </CardHeader>
                    <CardHeader className="flex pt-0">
                        <div>
                            <Check className="inline mr-2 mb-1 h-4 w-4 text-green-500" /> {t("license.feature1")} <br></br>
                            <Check className="inline mr-2 mb-1 h-4 w-4 text-green-500" /> {t("license.feature2")} <br></br>
                            <Check className="inline mr-2 mb-1 h-4 w-4 text-green-500" /> {t("license.feature3")} <br></br>
                        </div>
                    </CardHeader>
                    <CardHeader className="flex pt-0">
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => window.igniteView?.commandBridge?.purchaseLicense()}>{t("license.buyNow", { price: price })}</Button>
                            <div className="text-sm text-muted-foreground"><Lock className="inline mr-2 mb-1 h-4 w-4" /> {t("license.feature4")} </div>
                        </div>
                    </CardHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}

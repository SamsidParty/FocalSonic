import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { queryServerInfo } from "@/api/queryServerInfo";
import { Button } from "@/app/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter
} from "@/app/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Password } from "@/app/components/ui/password";
import { useAppActions, useAppData } from "@/store/app.store";
import { removeSlashFromUrl } from "@/utils/removeSlashFromUrl";
import { isTauri } from "@/utils/tauriTools";
import isWidevineSupported from "@/utils/widevine";
import { toast } from "react-toastify";
import { z } from "zod";
import { AppleMusicIconLarge } from "../icons/apple";
import { Separator } from "../ui/separator";

const loginSchema = z.object({
    url: z
        .string()
        .url({ message: "login.form.validations.url" })
        .refine((value) => /^https?:\/\//.test(value), {
            message: "login.form.validations.protocol",
        }),
    username: z
        .string({ required_error: "login.form.validations.username" })
        .min(2, { message: "login.form.validations.usernameLength" }),
    password: z
        .string({ required_error: "login.form.validations.password" })
        .min(2, { message: "login.form.validations.passwordLength" }),
});

type FormData = z.infer<typeof loginSchema>

const defaultUrl = isTauri() ? "http://" : "https://";
const url = window.SERVER_URL || defaultUrl;
const urlIsValid = url !== defaultUrl;

export function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [serverIsIncompatible, setServerIsIncompatible] = useState(false);
    const [widevineDialogOpen, setWidevineDialogOpen] = useState(false);
    const { saveConfig } = useAppActions();
    const { hideServer } = useAppData();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const enableSubsonic = false; // Future use

    const shouldHideUrlInput = urlIsValid && hideServer;

    const form = useForm<FormData>({
        resolver: zodResolver(loginSchema),
        values: {
            url,
            username: "",
            password: "",
        },
    });

    useEffect(() => {
        window.igniteView?.commandBridge.disposeAllAudioPlayers();
    }, []);

    async function onSubmit(data: FormData, forceCompatible?: boolean) {
        setLoading(true);

        // Check if server is compatible
        const serverInfo = await queryServerInfo(removeSlashFromUrl(data.url));

        // If server version is lower than 1.15.0
        if (serverInfo.protocolVersionNumber < 1150 && forceCompatible !== true) {
            setServerIsIncompatible(true);
            setLoading(false);
            return;
        } else {
            setServerIsIncompatible(false);
        }

        const status = await saveConfig({
            ...data,
            url: removeSlashFromUrl(data.url),
        });

        if (status) {
            await queryClient.invalidateQueries();
            toast.success(t("toast.server.success"));
            location.reload();
        } else {
            setLoading(false);
            toast.error(t("toast.server.error"));
        }
    }

    async function signInToAppleMusic() {
        // Check DRM support first
        if (!(await isWidevineSupported())) {
            setWidevineDialogOpen(true);
            return;
        }

        window.igniteView?.commandBridge.signInToAppleMusic();
    }

    // Called by C#
    window.completeAppleMusicLogin = async () => {
        await saveConfig({
            username: "Apple Music",
            password: "",
            url: "applemusic",
            serverType: "applemusic",
            protocolVersion: "1.16.0"
        });

        await queryClient.invalidateQueries();
        toast.success(t("toast.server.success"));
        setTimeout(() => location.reload(), 500);
    };

    return (
        <>
            <Card className="z-20 bg-transparent border-none shadow-none">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>

                        {
                            enableSubsonic && (
                                <CardContent className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem className={clsx(shouldHideUrlInput && "hidden")}>
                                                <FormLabel className="required">
                                                    {t("login.form.url")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        id="url"
                                                        type="text"
                                                        placeholder={t("login.form.urlDescription")}
                                                        autoCorrect="false"
                                                        autoCapitalize="false"
                                                        spellCheck="false"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t("login.form.urlDescription")}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem className={clsx(shouldHideUrlInput && "!mt-0")}>
                                                <FormLabel className="required">
                                                    {t("login.form.username")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        id="username"
                                                        type="text"
                                                        placeholder={t("login.form.usernamePlaceholder")}
                                                        autoCorrect="false"
                                                        autoCapitalize="false"
                                                        spellCheck="false"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="required">
                                                    {t("login.form.password")}
                                                </FormLabel>
                                                <FormControl>
                                                    <Password {...field} value={field.value ?? ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            )
                        }


                        <CardFooter className="flex flex-col gap-5">
                            {
                                enableSubsonic && (
                                    <>
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    {t("login.form.connecting")}
                                                </>
                                            ) : (
                                                <>{t("login.form.connect")}</>
                                            )}
                                        </Button>

                                        <Separator />
                                    </>
                                )
                            }

                            <div className="flex flex-col gap-2 items-center justify-center">
                                <img src="/favicon.png" alt="FocalSonic Logo" className="w-[12rem] rounded-lg overflow-hidden" />
                                <h1 className="text-[3rem] font-bold font-[EpicPro] text-white">FocalSonic</h1>
                            </div>
                            <Button type="button" onClick={signInToAppleMusic} className="w-full bg-[#ff0436]" style={{ "--foreground": "white" }} disabled={loading}>
                                {t("login.appleMusic.connect")}
                                <span className="ml-1"/>
                                <AppleMusicIconLarge />
                            </Button>
                        </CardFooter>

                    </form>
                </Form>
            </Card>
            <Dialog
                open={serverIsIncompatible}
                onOpenChange={setServerIsIncompatible}
            >
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t("server.incompatible.title")}</DialogTitle>
                    </DialogHeader>
                    <p>{t("server.incompatible.description")}</p>
                    <DialogFooter>
                        <Button onClick={form.handleSubmit((data) => onSubmit(data, true))}>
                            {t("server.incompatible.skip")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={widevineDialogOpen}
                onOpenChange={setWidevineDialogOpen}
            >
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t("login.appleMusic.widevineNotSupported")}</DialogTitle>
                    </DialogHeader>
                    <p>{t("login.appleMusic.widevineNotSupportedDescription")}</p>
                </DialogContent>
            </Dialog>
        </>
    );
}

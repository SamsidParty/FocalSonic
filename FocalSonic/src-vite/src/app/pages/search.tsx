import { checkServerType } from "@/utils/servers";
import clsx from "clsx";
import { t } from "i18next";
import { ArrowRightIcon } from "lucide-react";
import React from "react";
import { Form, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/searchinput";
import SearchResults from "./search-results";

export default function Search() {
    // Get route params
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");

    // Return search page if the query param is not present
    if (!query) {
        return <SearchPage />;
    }

    // Render a simple results placeholder when a query is present
    return <SearchResults query={query} />;
}


function SearchPage() {
    const { isAppleMusic } = checkServerType();

    return (
        <div 
            className={
                clsx(
                    "flex h-screen items-center justify-center",
                    "pb-player"
                )
            }
        >
            <Form className="w-full flex items-center justify-between gap-2 flex-row max-w-2xl">
                <SearchInput
                    placeholder={t("command.inputPlaceholder")}
                    className="w-full"
                    name="q"
                    autoFocus
                />
                <Button type="submit">
                    <ArrowRightIcon />
                </Button>
            </Form>
        </div>
    );
}
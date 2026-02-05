import React from "react";
import { LastFMSettings } from "./lastfm";
import { Services } from "./services";

export function Integrations() {
    return (
        <div className="space-y-4">
            <Services />
            <LastFMSettings />
        </div>
    );
}

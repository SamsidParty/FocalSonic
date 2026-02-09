import React from "react";
import Equalizer from "../player/equalizer";

export default function ExtrabarEffects() {
    return (
        <div className="flex flex-col h-full mb-2 overflow-clip">
            <Equalizer />
        </div>
    );
}
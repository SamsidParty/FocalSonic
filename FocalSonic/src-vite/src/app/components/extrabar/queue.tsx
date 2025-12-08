import React from "react";
import { QueueSongList } from "../queue/song-list";

export default function ExtrabarQueue() {
    return (
        <div className="p-2 overflow-hidden h-full">
            <QueueSongList small={true} />
        </div>
    );
}
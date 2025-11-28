import React from "react";
import { QueueSongList } from "../queue/song-list";

export default function ExtrabarQueue() {
    return (
        <div className="p-2">
            <QueueSongList small={true} />
        </div>
    );
}
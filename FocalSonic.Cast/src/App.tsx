/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/globals */
 
import { useEffect, useState } from 'react';
import './App.css';
import SplashScreen from './components/splashscreen';
import appleMusicPlaybackInterface from './lib/apple-music';
import chromecastControlInterface from './lib/chromecast';
import debugControlInterface from './lib/debug';
import { requestWakeLock } from './lib/wake-lock';
import type ControlInterface from './types/control-interface';
import type { ControlInterfacePacket } from './types/control-interface';
import type PlaybackInterface from './types/playback-interface';
import type { Status } from './types/status';

let playbackInterface: PlaybackInterface | null = null;
let controlInterface: ControlInterface | null = null;

declare global {
    interface Window {
        setCurrentStatus?: (status: Status) => void;
        currentStatus?: Status;
        initializeCalled?: boolean;
    }
}

function App() {

    if (!controlInterface) {
        // Determine and assign the appropriate control interface
        if (window.location.href.includes("chromecast")) {
            controlInterface = chromecastControlInterface;
        }
        else if (window.location.href.includes("debug")) {
            controlInterface = debugControlInterface;
        }
        else {
            controlInterface = {} as unknown as ControlInterface;
        }
    }

    const [currentStatus, _setCurrentStatus] = useState<Status>({ isLoading: true, statusCode: "default", statusMessage: "Initializing..." });
    const setCurrentStatus = (status: Status) => {
        if (JSON.stringify(window.currentStatus) == JSON.stringify(status)) return;
        window.currentStatus = status;
        _setCurrentStatus(Object.assign({}, status));
    };
    window.setCurrentStatus = setCurrentStatus;
    window.currentStatus = currentStatus;

    const handleEvent = async (event: ControlInterfacePacket) => {

        console.log(`[${event.type}] Event received: ${JSON.stringify(event.data).length < 40 ? JSON.stringify(event.data) : "[DATA TOO LARGE TO DISPLAY]"}`);

        if (event.type === "setCredentials") {
            // Determine and assign the appropriate playback interface
            if (event.data[0] === "applemusic") {
                playbackInterface = appleMusicPlaybackInterface;
            }

            setCurrentStatus({ statusCode: "ready", statusMessage: "" });
            requestWakeLock(); // Prevents sleeping during playback
        }

        try {
            await playbackInterface?.handleEvent(event);
        }
        catch (err: any) {
            console.error(err);
            setCurrentStatus({ isError: true, statusCode: "playback-error", statusMessage: `Playback interface error: ${err.toString()}` });
        }
    };

    useEffect(() => {

        if (!controlInterface?.initialize) {
            setCurrentStatus({ isError: true, statusCode: "no-control-interface", statusMessage: "No control interface available" });
            return;
        }

        const initialize = async () => {

            // Prevent multiple initializations
            if (window.initializeCalled) return;
            window.initializeCalled = true;


            try {
                await controlInterface?.initialize(handleEvent);
            }
            catch (err: any) { 
                console.error(err);
                setCurrentStatus({ isError: true, statusCode: "init-failed", statusMessage: `Control interface initialization failed: ${err.toString()}` });
                return;
            }
        };

        initialize();
    }, []);

    return (
        <>
            <div className="app">
                <SplashScreen status={currentStatus} />
            </div>
        </>
    )
}

export default App

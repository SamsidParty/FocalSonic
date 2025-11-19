/* eslint-disable react-hooks/globals */
 
import { useEffect, useState } from 'react';
import './App.css';
import SplashScreen from './components/splashscreen';
import appleMusicPlaybackInterface from './lib/apple-music';
import chromecastControlInterface from './lib/chromecast';
import type ControlInterface from './types/control-interface';
import type { ControlInterfacePacket } from './types/control-interface';
import type PlaybackInterface from './types/playback-interface';
import type { Status } from './types/status';

let playbackInterface: PlaybackInterface | null = null;
let controlInterface: ControlInterface | null = null;

function App() {

    if (!controlInterface) {
        // Determine and assign the appropriate control interface
        if (window.location.href.includes("chromecast")) {
            controlInterface = chromecastControlInterface;
        }
        else {
            controlInterface = {} as unknown as ControlInterface;
        }
    }

    const [currentStatus, _setCurrentStatus] = useState<Status>({ isLoading: true, statusCode: "default", statusMessage: "Initializing..." });
    const setCurrentStatus = (status: Status) => _setCurrentStatus(Object.assign({}, status));
    window.setCurrentStatus = setCurrentStatus;

    const handleEvent = async (event: ControlInterfacePacket) => {

        console.log(`[${event.type}] Event received: ${JSON.stringify(event.data).length < 40 ? JSON.stringify(event.data) : "[DATA TOO LARGE TO DISPLAY]"}`);

        if (event.type === "setCredentials") {
            // Determine and assign the appropriate playback interface
            if (event.data[0] === "applemusic") {
                playbackInterface = appleMusicPlaybackInterface;
            }

            setCurrentStatus({ statusCode: "ready", statusMessage: "" });
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
                await controlInterface.initialize(handleEvent);
            }
            catch (err: any) { 
                console.error(err);
                setCurrentStatus({ isError: true, statusCode: "init-failed", statusMessage: `Control interface initialization failed: ${err.toString()}` });
                return;
            }
 
            setCurrentStatus({ isLoading: true, statusCode: "loading-playback", statusMessage: "Loading playback interface..." })


            setCurrentStatus({ statusCode: "ready", statusMessage: "Ready for playback" });
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

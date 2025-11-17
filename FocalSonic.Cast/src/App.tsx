/* eslint-disable react-hooks/globals */
 
import { useEffect, useState } from 'react';
import './App.css';
import SplashScreen from './components/splashscreen';
import appleMusicPlaybackInterface from './lib/apple-music';
import chromecastControlInterface from './lib/chromecast';
import type ControlInterface from './types/control-interface';
import type { ControlInterfacePacket, MediaSourceData } from './types/control-interface';
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

    const handleEvent = async (event: ControlInterfacePacket) => {
        if (event.type === "setSource") {
            const data = event.data as MediaSourceData;
        
            // Set the media source
            if (!playbackInterface) {
                // Determine and assign the appropriate playback interface
                if (data.playbackInterface === "applemusic") {
                    playbackInterface = appleMusicPlaybackInterface;
                }
            }

            try {
                await playbackInterface?.setSource(data);
                setCurrentStatus({ statusCode: "playing", statusMessage: "" });
            }
            catch (err: any) {
                console.error(err);
                setCurrentStatus({ isError: true, statusCode: "playback-set-source-failed", statusMessage: `Playback interface initialization failed: ${err?.message}` });
                return;
            }
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

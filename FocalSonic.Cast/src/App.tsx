/* eslint-disable react-hooks/globals */
 
import { useEffect, useState } from 'react';
import './App.css';
import SplashScreen from './components/splashscreen';
import appleMusicPlaybackInterface from './lib/apple-music';
import chromecastControlInterface from './lib/chromecast';
import type ControlInterface from './types/control-interface';
import type { ControlInterfaceInitializeResult } from './types/control-interface';
import type PlaybackInterface from './types/playback-interface';
import type { Status } from './types/status';

let playbackInterface: PlaybackInterface;
let controlInterface: ControlInterface;

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

    useEffect(() => {

        if (!controlInterface.initialize) {
            setCurrentStatus({ isError: true, statusCode: "no-control-interface", statusMessage: "No control interface available" });
            return;
        }

        const initialize = async () => {
            let result: ControlInterfaceInitializeResult = {} as ControlInterfaceInitializeResult;
            try {
                result = await controlInterface.initialize();
            }
            catch { setCurrentStatus({ isError: true, statusCode: "init-failed", statusMessage: "Control interface initialization failed" }); return; }
 
            setCurrentStatus({ isLoading: true, statusCode: "loading-playback", statusMessage: "Loading playback interface..." })

            // Determine and assign the appropriate playback interface
            if (result?.playbackInterfaceName === "applemusic") {
                playbackInterface = appleMusicPlaybackInterface;
            }
            else {
                setCurrentStatus({ isError: true, statusCode: "no-playback-interface", statusMessage: "No playback interface available" });
                return;
            }

            try {
                await playbackInterface.initialize(result);
            }
            catch { setCurrentStatus({ isError: true, statusCode: "init-failed", statusMessage: "Playback interface initialization failed" });  return;  }

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

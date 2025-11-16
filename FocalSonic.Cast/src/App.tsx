 
import { useEffect, useState } from 'react';
import './App.css';
import SplashScreen from './components/splashscreen';
import appleMusicPlaybackInterface from './lib/apple-music';
import type { Status } from './types/status';

const playbackInterface = appleMusicPlaybackInterface;

function App() {

    const [currentStatus, _setCurrentStatus] = useState<Status>({ isLoading: true, statusCode: "default", statusMessage: "Initializing..." });

    const setCurrentStatus = (status: Status) => _setCurrentStatus(Object.assign({}, status));

    useEffect(() => {
        playbackInterface.initialize()
            .then(() => setCurrentStatus({ statusCode: "ready", statusMessage: "Ready for playback" }))
            .catch(() => setCurrentStatus({ statusCode: "init-failed", isError: true, statusMessage: "Initialization failed" }));
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

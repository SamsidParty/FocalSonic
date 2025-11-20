import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import "./index.css";
import './lib/screenlog';


//window.screenLog.init();
console.log("FocalSonic cast receiver starting...");

let ComponentToRender = App;

if (window.location.href.includes("hlstest")) {
    ComponentToRender = (await import('./components/hls-test.tsx')).default;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ComponentToRender />
  </StrictMode>,
)

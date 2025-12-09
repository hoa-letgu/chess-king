import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
//import "@/styles/chess-highlight.css";
//import "@/styles/capture-animation.css";

import App from './App.tsx'
import { SocketProvider } from "@/context/SocketProvider";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <SocketProvider>
    <App />
  </SocketProvider>
  </StrictMode>,
)

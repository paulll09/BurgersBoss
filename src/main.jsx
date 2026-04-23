import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capture stable viewport height ONCE — immune to Instagram/TikTok
// in-app browser chrome show/hide which changes vh dynamically.
// Set as CSS custom property so any element can use it.
const stableVh = window.visualViewport?.height ?? window.innerHeight;
document.documentElement.style.setProperty('--stable-vh', `${stableVh}px`);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

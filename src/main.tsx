import { StrictMode } from 'react'
import '@fontsource-variable/inter'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support (production builds only, so development always loads fresh files)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // Hand over what this first visit already loaded so it works offline next time
        const urls = performance.getEntriesByType('resource').map((e) => e.name)
        reg.active?.postMessage({ type: 'cache-urls', urls })
      })
      .catch(() => {
        /* offline mode is optional */
      })
  })
}

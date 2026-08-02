import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getInitialTheme, applyTheme } from './utils/theme.js'

// Feature 7: apply the saved (or OS-preferred) theme immediately, before
// React mounts, so there's no flash of the wrong theme on load.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

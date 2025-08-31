import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // Temporarily disabled StrictMode to prevent 429 errors in development
  // <StrictMode>
    <App />
  // </StrictMode>,
)

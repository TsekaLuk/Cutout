import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { detectInitialLocale } from '@/i18n/detect'
import { activateLocale } from '@/i18n'

/**
 * Gate first paint on async locale detection (spec §4.1 / R1): detect + activate
 * BEFORE `createRoot().render()` so the UI never flashes the source locale on a
 * cold start. `detectInitialLocale` is guarded and never throws.
 */
async function bootstrap() {
  await activateLocale(await detectInitialLocale())

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()

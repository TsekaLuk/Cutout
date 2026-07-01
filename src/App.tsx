/**
 * App root (spec §3 / §4c).
 *
 * Provider order (outer → inner):
 *   ThemeProvider (next-themes, drives the `.dark` class our tokens key off)
 *     Providers        (QueryClient + Tooltip + Toaster — pre-built)
 *       ServiceProvider(createRegistry())  — the I/O swap seam
 *         AppShell     — TopBar · WorkspaceLayout · StatusBar
 *
 * The service registry (and its dedicated one-shot cutout worker) is built ONCE
 * via a `useState` initializer; AppShell owns a SEPARATE live-preview worker via
 * `useAnalysisBridge`. Two clearly-scoped workers, per spec §4b/§5.
 */
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Providers } from '@/components/Providers'
import { ServiceProvider } from '@/services/context'
import { AppShell } from '@/components/AppShell'
import { createRegistry } from '@/bootstrap'

export default function App() {
  const [registry] = useState(createRegistry)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <Providers>
        <ServiceProvider registry={registry}>
          <AppShell />
        </ServiceProvider>
      </Providers>
    </ThemeProvider>
  )
}

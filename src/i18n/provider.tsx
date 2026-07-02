/**
 * Lingui React provider wrapper (spec §4.1).
 *
 * Wraps the shared `i18n` instance in `@lingui/react`'s `I18nProvider` so that
 * `Trans` / `useLingui` subscribers re-render on `activateLocale`. Mounted at the
 * app root (inside `ThemeProvider`, around `Providers`/`AppShell`) — see App.tsx.
 */
import type { ReactNode } from 'react'
import { I18nProvider } from '@lingui/react'
import { i18n } from './index'

export function I18n({ children }: { children: ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

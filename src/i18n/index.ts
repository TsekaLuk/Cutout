/**
 * i18n runtime instance + locale activation (spec §4.1).
 *
 * A single `@lingui/core` `i18n` instance backs the whole app. `activateLocale`
 * dynamically imports the requested locale's compiled catalog (per-locale code
 * split — only the active locale's messages sit in memory), activates it, and
 * syncs `<html lang/dir>`. Switching re-renders every `Trans`/`useLingui`
 * subscriber under `<I18nProvider>` in React 19 with no reload.
 */
import { i18n } from '@lingui/core'
import { dirOf, type Locale } from './config'
import { persistLocale } from './detect'

/**
 * Load + activate a locale.
 *
 * @param locale  supported locale tag
 * @param persist when `true`, also write the choice to the managed store so it
 *                survives restart (used by the language switcher, not by boot)
 */
export async function activateLocale(
  locale: Locale,
  persist = false,
): Promise<void> {
  // Template-literal specifier → Vite emits a per-locale chunk glob; the Lingui
  // Vite plugin compiles the `.po` on the fly (no separate `lingui compile` in dev).
  const { messages } = await import(`../locales/${locale}/messages.po`)
  i18n.loadAndActivate({ locale, messages })

  document.documentElement.lang = locale
  document.documentElement.dir = dirOf(locale)

  if (persist) await persistLocale(locale)
}

export { i18n }

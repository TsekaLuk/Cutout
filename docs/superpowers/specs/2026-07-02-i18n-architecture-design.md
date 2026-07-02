# Cutout i18n Architecture Spec

## 1. Decision & Rationale

**Winner: Lingui (`js-lingui` v6.x)** — compile-time macro extraction + ~3 kb runtime + full ICU + reactive React 19 provider + the lowest-friction migration for Cutout's already-bilingual literals.

### Why, in one line
Lingui is the only candidate that satisfies **all** of the brief's top-weighted axes at once: it keeps the JS payload tiny (compile-time extraction, catalogs code-split per locale), gives typed params + a macro model that eliminates the "typo'd string key → `undefined`" class entirely, ships a first-party Vite plugin that already adapts to Vite 8 / Rolldown, has **reference-grade ICU** (which Paraglide lacks), and re-renders on live locale switch with **no page reload** (which Paraglide needs manual wiring for). Its migration model — *the existing literal becomes the source message* — is uniquely suited to ~30 components full of hardcoded zh/en text.

### Comparison table (10 criteria, this stack)

| # | Criterion (weight) | **Lingui** | Paraglide | i18next |
|---|---|:--:|:--:|:--:|
| 1 | Bundle / tree-shaking (×3) | **5** – ~3 kb core, pre-parsed ICU, per-locale code-split | 5 – per-message fns, best-in-class | 2 – ~65–75 kb runtime + ICU in bundle |
| 2 | Key type-safety (×3) | **4** – typed params; macro removes missing-key class; keyed IDs give rename safety | 5 – messages are typed fns | 3.5 – generated `.d.ts`, drifts if not regenerated |
| 3 | Vite 8 integration (×2) | **5** – first-party plugin, Rolldown preset, HMR | 5 – unplugin, HMR | 3 – no official plugin, DIY HMR |
| 4 | ICU MessageFormat (×1.5) | **5** – full plural/select/selectordinal + `Intl` number/date | 2 – **no ICU**, DIY `Intl` | 4 – ICU as bolt-on (disables native plurals) |
| 5 | Runtime / React 19 reactivity (×2) | **5** – `I18nProvider` re-renders on `activate`, no reload | 3 – `setLocale` reloads or manual re-render | 4 – `useSyncExternalStore`, reactive |
| 6 | Tauri OS-locale detect + persist (×2) | **4** – bridge `plugin-os` + own store (trivial) | 4 – custom strategy | 4 – detector plugin + custom glue |
| 7 | DX + tooling (×1.5) | **4** – macros, VS Code ext, `extract`; lint is ESLint-only (oxlint gap) | 4 – Sherlock ext | 4.5 – best ecosystem (`i18next-cli`, i18n-ally) |
| 8 | Migration of mixed literals (×1.5) | **5** – wrap literal → literal *is* the message | 3 – per-string interactive, no batch codemod | 4 – codemod exists, manual cross-locale fill |
| 9 | RTL readiness (×1) | **3** – you own `dir`, Tailwind v4 logical props | 4 – `getTextDirection()` built in | 3 – `i18n.dir()` |
| 10 | Ecosystem maturity (×1.5) | **4** – mature, active 6.x, smaller than i18next | 3 – single-vendor, younger | 5 – reference standard |
| | **Weighted / 95** | **≈ 4.5** | ≈ 4.2 | ≈ 3.6 |

### Why the runners-up lost **for this stack**
- **Paraglide** — Excellent bundle/types, but **no ICU MessageFormat** (an AI/data tool renders counts, sizes, timestamps → you'd hand-roll `Intl` wrappers), and `setLocale` **reloads by default** with no automatic React reactivity (manual `key`-bump / store-tick to switch language in the Settings panel without losing panel/scroll state). Single-vendor risk on a long roadmap. Loses on #4 and #5 — both weighted for a live-switching desktop UI.
- **i18next** — Lowest-risk and best tooling, but architecturally on the wrong side of the brief: a **~65–75 kb runtime engine ships in the bundle**, **no compile-time extraction**, **no first-party Vite plugin**, and type-safety is a **generated `.d.ts` that drifts**. Loses hardest on #1 and #2 — the two ×3 axes.

---

## 2. Tech + Exact Packages/Versions + Vite 8 Config

### Packages (pin latest `6.x`)

| Package | Version | Role |
|---|---|---|
| `@lingui/core` | `^6.x` | Runtime `i18n` engine (ICU formatter, ~3 kb) |
| `@lingui/react` | `^6.x` | `I18nProvider`, `Trans`, `useLingui` |
| `@lingui/vite-plugin` | `^6.x` | Compiles `.po` catalogs on the fly (Vite 8 + Rolldown-ready; publishes a Rolldown Babel preset) |
| `@lingui/babel-plugin-lingui-macro` | `^6.x` | Macro transform (Babel path, for `@vitejs/plugin-react`) |
| `@lingui/cli` | `^6.x` | `lingui extract` / `compile` |
| `@lingui/conf` | `^6.x` | Config types |
| `@tauri-apps/plugin-os` | `^2.x` | `locale()` → system BCP-47 tag |
| `@tauri-apps/plugin-store` | `^2.x` | Persist the user's explicit language choice |

> Verified: `@lingui/plugin-os locale()` returns a BCP-47 tag or `null` ([Tauri v2 OS plugin](https://v2.tauri.app/reference/javascript/os/)); `@lingui/vite-plugin` is on active 6.x (published May 2026) and exposes `linguiTransformerBabelPreset` for Rolldown/Vite 8 ([npm](https://www.npmjs.com/package/@lingui/vite-plugin), [Lingui Vite plugin docs](https://lingui.dev/ref/vite-plugin)). **Confirm the exact 6.x patch and the `vite` peer range with `npm info @lingui/vite-plugin peerDependencies` at install time** (see §9).

### Install
```bash
pnpm add @lingui/core @lingui/react @tauri-apps/plugin-os @tauri-apps/plugin-store
pnpm add -D @lingui/vite-plugin @lingui/cli @lingui/conf @lingui/babel-plugin-lingui-macro
```

### `vite.config.ts` (Babel macro path — assumes `@vitejs/plugin-react`)
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  plugins: [
    react({ babel: { plugins: ["@lingui/babel-plugin-lingui-macro"] } }),
    lingui(),        // compiles src/locales/**/messages.po on the fly (no separate `lingui compile` in dev)
    tailwind(),
  ],
});
```
> If Cutout uses `@vitejs/plugin-react-swc` instead, swap the macro for `@lingui/swc-plugin` in the SWC plugin list (see §9).

### `lingui.config.ts`
```ts
import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en", "zh-CN"],        // add "ja" later — one line
  sourceLocale: "en",              // source messages authored in English
  fallbackLocales: { default: "en" },
  catalogs: [{
    path: "<rootDir>/src/locales/{locale}/messages",
    include: ["src"],
    exclude: ["**/node_modules/**", "src/locales/**"],
  }],
  format: "po",                    // translator-friendly (poedit/Weblate); gettext parity checks
};
export default config;
```

### `package.json` scripts
```json
{
  "scripts": {
    "i18n:extract": "lingui extract",
    "i18n:extract:clean": "lingui extract --clean",
    "i18n:compile": "lingui compile",
    "i18n:ci": "lingui extract --clean && git diff --exit-code src/locales"
  }
}
```

---

## 3. Architecture

### 3.1 Catalog structure
```
src/locales/
  en/messages.po        # sourceLocale — English source strings
  zh-CN/messages.po     # Simplified Chinese translations
  # ja/messages.po      # future: add "ja" to lingui.config + drop this file
```
`.po` gives translators standard tooling and gettext-style parity diffs. Compiled to code-split JS by the Vite plugin / `lingui compile`.

### 3.2 Key naming convention (explicit IDs — chosen for build-time rename safety)
The brief weights **key type-safety / rename safety** at ×3, so Cutout uses **explicit, dot-namespaced IDs**, with the source English as the inline `message`. This decouples the stable key from the display text (rename source copy without orphaning translations) — stronger than auto-hashed IDs.

```
<area>.<element>_<action|noun>
```
| Area (folder) | Example key | Source (en) |
|---|---|---|
| `topbar` | `topbar.export_button` | `Export` |
| `slices` | `slices.count` | `{count, plural, one {# slice} other {# slices}}` |
| `inspector` | `inspector.adjust_title` | `Adjust slice` |
| `settings` | `settings.byok_api_key_label` | `API key` |
| `status` | `status.saving` | `Saving…` |

### 3.3 Type-safety mechanism
| Layer | What it catches | How |
|---|---|---|
| Macro compile | Typo'd/undeclared usage can't silently render `undefined` — source text is the guaranteed fallback | `t`/`Trans` are compiled, not string lookups |
| TypeScript (`tsc`) | Wrong/missing interpolation **param types** (e.g. `count` not passed) | Macro emits typed message functions |
| `lingui extract --clean` (CI) | Renamed/removed keys → catalog diff; unused messages pruned | `pnpm i18n:ci` fails if catalogs drift from source |
| Vitest parity test (§8) | `en` vs `zh-CN` key-set mismatch → missing translations | Test parses both `.po`, asserts identical ID sets |

### 3.4 Locale state, switching & React 19 reactivity
- Single `i18n` instance from `@lingui/core`; `<I18nProvider i18n={i18n}>` at the app root.
- Switch = `i18n.loadAndActivate({ locale, messages })` → provider pushes an update; every `useLingui()` / `Trans` subscriber re-renders in React 19. **No reload, panel/scroll state preserved.**
- Catalogs loaded via dynamic `import()` → per-locale code-split; only the active locale's messages are in memory.

### 3.5 OS-locale detection (Tauri) + persistence of user choice
**Persistence store: `@tauri-apps/plugin-store`** (a managed JSON store file, e.g. `settings.json`) — the idiomatic Tauri desktop choice, survives reinstalls of webview storage and lives alongside other app settings (BYOK, etc.). `localStorage` is the simpler fallback if a store isn't already wired.

**Resolution order** (first hit wins):
1. **Saved user choice** — `store.get("locale")` (explicit override)
2. **OS locale** — `@tauri-apps/plugin-os` `locale()` → e.g. `"zh-Hans-CN"` → normalize to `zh-CN`
3. **`navigator.language`** — webview fallback
4. **`en`** — source/fallback

```ts
// src/i18n/detect.ts
import { locale as osLocale } from "@tauri-apps/plugin-os";
import { LazyStore } from "@tauri-apps/plugin-store";
import { SUPPORTED, type Locale } from "./config";

const store = new LazyStore("settings.json");

function normalize(tag?: string | null): Locale | undefined {
  if (!tag) return undefined;
  const t = tag.toLowerCase();
  if (t.startsWith("zh")) return "zh-CN";
  if (t.startsWith("en")) return "en";
  return undefined; // extend for ja, etc.
}

export async function detectInitialLocale(): Promise<Locale> {
  const saved = await store.get<Locale>("locale");
  if (saved && SUPPORTED.includes(saved)) return saved;
  return normalize(await osLocale()) ?? normalize(navigator.language) ?? "en";
}

export async function persistLocale(locale: Locale) {
  await store.set("locale", locale);
  await store.save();
}
```

### 3.6 ICU plurals / interpolation
Full ICU through macros — no runtime parser cost (compiled catalogs pre-parse). Numbers/dates via the `i18n` object (CLDR-correct per active locale).
```tsx
<Trans>{`{count, plural, one {# slice} other {# slices}}`}</Trans>   // plural
t`Exporting ${name}`                                                 // interpolation
i18n.number(bytes, { notation: "compact", style: "unit", unit: "megabyte" })
i18n.date(ts, { dateStyle: "medium", timeStyle: "short" })
```

### 3.7 RTL readiness (mechanism, not translations)
A locale→direction map drives `<html dir>`; Tailwind v4 **logical properties** (`ms-`, `me-`, `ps-`, `text-start`) do the visual work. No RTL locales ship now; the switch is one map entry away.
```ts
// src/i18n/config.ts
export const SUPPORTED = ["en", "zh-CN"] as const;
export type Locale = (typeof SUPPORTED)[number];
const RTL = new Set(["ar", "he", "fa", "ur"]);
export const dirOf = (l: string) => (RTL.has(l.split("-")[0]) ? "rtl" : "ltr");
```
Applied in `activateLocale` (§4): `document.documentElement.dir = dirOf(locale)`.

---

## 4. Component API

### 4.1 i18n bootstrap
```ts
// src/i18n/index.ts
import { i18n } from "@lingui/core";
import { dirOf, type Locale } from "./config";
import { persistLocale } from "./detect";

export async function activateLocale(locale: Locale, persist = false) {
  const { messages } = await import(`../locales/${locale}/messages.po`); // code-split, compiled by vite plugin
  i18n.loadAndActivate({ locale, messages });
  document.documentElement.lang = locale;
  document.documentElement.dir = dirOf(locale);
  if (persist) await persistLocale(locale);
}
export { i18n };
```
```tsx
// src/i18n/provider.tsx
import { I18nProvider } from "@lingui/react";
import { i18n } from "./index";
export const I18n = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider i18n={i18n}>{children}</I18nProvider>
);
```
```tsx
// main.tsx — gate first paint on async detection to avoid a language flash
import { detectInitialLocale } from "@/i18n/detect";
import { activateLocale } from "@/i18n";
import { I18n } from "@/i18n/provider";

await activateLocale(await detectInitialLocale());
createRoot(el).render(<I18n><App /></I18n>);
```

### 4.2 How a developer writes a translated string
```tsx
import { Trans, useLingui } from "@lingui/react/macro";

export function SliceInspector({ count, name }: { count: number; name: string }) {
  const { t, i18n } = useLingui();
  return (
    <section title={t({ id: "inspector.adjust_title", message: "Adjust slice" })}>
      {/* JSX text, explicit key */}
      <Trans id="inspector.heading">Slices</Trans>

      {/* ICU plural */}
      <Trans id="slices.count">{`{count, plural, one {# slice} other {# slices}}`}</Trans>

      {/* interpolation */}
      <p>{t({ id: "inspector.exporting", message: `Exporting ${name}` })}</p>

      {/* locale-aware number */}
      <span>{i18n.number(count)}</span>
    </section>
  );
}
```
Rules: **every user-visible literal gets an explicit `id`**; `message` = English source; params are TS-typed. Non-UI strings (log keys, enum values) are left alone.

### 4.3 `LanguageSwitcher` (shadcn, fits TopBar + SettingsMenu)
```tsx
// src/components/common/LanguageSwitcher.tsx
import { useLingui, Trans } from "@lingui/react/macro";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { activateLocale } from "@/i18n";
import { SUPPORTED, type Locale } from "@/i18n/config";

const LABEL: Record<Locale, string> = { en: "English", "zh-CN": "简体中文" };

export function LanguageSwitcher({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const { i18n } = useLingui();
  const current = i18n.locale as Locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" aria-label="Language">
            <Languages className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Languages className="size-4 me-2" />{LABEL[current]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(v) => void activateLocale(v as Locale, /* persist */ true)}
        >
          {SUPPORTED.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>{LABEL[l]}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```
- **TopBar**: `<LanguageSwitcher variant="icon" />` next to existing actions.
- **SettingsMenu / settings panel**: `<LanguageSwitcher variant="row" />` in a labeled settings row (`<Trans id="settings.language_label">Language</Trans>`).

---

## 5. Migration Plan (~30 mixed zh/en components)

### Method: wrap-in-place → extract → seed counterpart
Lingui's model means **wrapping is the entire authoring step** — no separate key file to hand-maintain.

**Per literal:**
| Current literal | Action | Result |
|---|---|---|
| `Export` (en) | `<Trans id="topbar.export_button">Export</Trans>` | `en` source set; add `zh-CN` translation |
| `切片` (zh) | `<Trans id="slices.heading">Slices</Trans>` (author en source) + put `切片` in `zh-CN` | both locales seeded from existing text |
| `title="设置"` | `title={t({ id: "settings.title", message: "Settings" })}` | attribute string handled |

**Seeding both locales from current bilingual text:**
1. `sourceLocale: "en"` → the inline `message` is English.
2. For **already-English** literals: wrap → source auto-fills `en`; supply `zh-CN`.
3. For **already-Chinese** literals: author the English `message` from the Chinese meaning, then paste the original Chinese into `zh-CN/messages.po`. The existing zh text is *not thrown away* — it becomes the zh-CN translation.
4. `pnpm i18n:extract` harvests all wrapped messages into both catalogs and marks empty entries per locale → a precise to-translate worklist.

**Tooling reality:** no perfect codemod decides UI-copy vs code — wrapping is a human (optionally `jscodeshift`-assisted) pass, but because IDs are explicit and the literal is the message, review is fast. `lingui extract` gives the missing-translation list; `lingui extract --clean` prunes orphans. Optional interactive help from the Lingui VS Code extension.

### Order (by area, low-risk → high-churn; commit per area)
1. `status/**` (few short strings — proves the pipeline)
2. `topbar/**`
3. `source/**`
4. `preview/**`
5. `slices/**`
6. `inspector/**`
7. `settings/**` — **last, after BYOK lands** (includes new `settings/byok/*`, API-key/provider labels, validation messages)

---

## 6. File-Tree Additions
```
Cutout/
├─ lingui.config.ts                      # NEW
├─ vite.config.ts                        # MOD: react babel macro + lingui()
├─ package.json                          # MOD: i18n:* scripts + deps
├─ src/
│  ├─ main.tsx                           # MOD: detect + activate before render
│  ├─ i18n/                              # NEW
│  │  ├─ config.ts                       #   SUPPORTED, Locale, dirOf
│  │  ├─ detect.ts                       #   OS locale + plugin-store persistence
│  │  ├─ index.ts                        #   i18n instance + activateLocale
│  │  └─ provider.tsx                    #   <I18nProvider> wrapper
│  ├─ locales/                           # NEW (generated by `lingui extract`)
│  │  ├─ en/messages.po
│  │  └─ zh-CN/messages.po
│  └─ components/
│     └─ common/LanguageSwitcher.tsx     # NEW
└─ src-tauri/
   └─ src/lib.rs / main.rs               # MOD: register tauri_plugin_os + tauri_plugin_store
```
Plus `src-tauri/capabilities/*.json` permissions for `os:allow-locale` and `store:*`.

---

## 7. Phased Implementation Plan

> **Prerequisite:** the in-flight **BYOK feature must land first** — it introduces shared `settings/*` components (API-key inputs, provider selectors, validation copy) that are part of the migration set. Migrating settings before BYOK merges would cause churn/conflicts.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Prereq** | BYOK merged; `settings/byok/*` present | Settings component surface stable |
| **1. Infra** | Deps; `vite.config` macro + `lingui()`; `lingui.config.ts`; `src/i18n/*`; Rust plugin registration (`os`, `store`) + capabilities; boot detection; migrate **one** `status` string end-to-end | App boots in OS locale; one string switches live via a temp toggle; `pnpm i18n:extract` produces both `.po` |
| **2. Migrate area-by-area** | `status → topbar → source → preview → slices → inspector → settings (incl. BYOK)`; wrap literals, extract, fill zh-CN, commit per area | Zero user-visible hardcoded literals per area; catalogs have no empty `en`/`zh-CN` entries |
| **3. Switcher** | `LanguageSwitcher` in TopBar (icon) + Settings panel (row); persist choice to `plugin-store` | Switching updates whole UI without reload; choice survives app restart |
| **4. Verify & extensibility** | `pnpm i18n:ci` in CI; parity + render-smoke tests (§8); add `ja` stub to prove cheap extension | CI green; adding `ja` = 1 config line + 1 empty `.po` |

---

## 8. Testing

| Test | Guarantees | Implementation |
|---|---|---|
| **Type-check** (`tsc --noEmit`) | Missing/mistyped interpolation params fail the build; macro model prevents silent `undefined` | Part of existing CI |
| **Catalog sync** (`pnpm i18n:ci`) | Renamed/removed keys or un-extracted messages fail CI | `lingui extract --clean` + `git diff --exit-code src/locales` |
| **Key-set parity** (Vitest) | `en` and `zh-CN` expose **identical** message-ID sets → no missing translations | see snippet |
| **Render smoke** (Vitest + RTL) | Each area renders under `I18nProvider` in both locales without throwing / missing-translation warnings | render each area with `en` then `zh-CN` |
| *(optional)* **Pseudo-locale** | Visual QA of un-wrapped strings / truncation | add `pseudoLocale: "pseudo"` in config |

```ts
// src/i18n/__tests__/parity.test.ts
import { describe, it, expect } from "vitest";
import { messages as en } from "../../locales/en/messages.po";
import { messages as zh } from "../../locales/zh-CN/messages.po";

describe("catalog parity", () => {
  it("en and zh-CN have identical key sets", () => {
    const ke = Object.keys(en).sort();
    const kz = Object.keys(zh).sort();
    expect(kz).toEqual(ke); // fails listing the diverging IDs
  });
  it("no empty zh-CN values", () => {
    for (const [k, v] of Object.entries(zh)) expect(v, `empty translation: ${k}`).toBeTruthy();
  });
});
```
> Vitest must load the macro transform (Babel plugin in the test transform config), or `Trans` renders raw and smoke tests give false negatives (see §9).

---

## 9. Open Assumptions to Verify + Risks

| # | Assumption / Risk | Verify / Mitigate |
|---|---|---|
| A1 | Cutout uses `@vitejs/plugin-react` (**Babel**), so the Babel macro path applies | If `plugin-react-swc`: replace macro with `@lingui/swc-plugin` (`^6.x`) in the SWC plugin list |
| A2 | Exact `@lingui/*` 6.x patch and **`vite` peer range** (npm showed 6.1.0 May 2026; eval cited 6.4.0) | `npm info @lingui/vite-plugin version peerDependencies` before pinning; confirm `vite: ^8` is in range (Rolldown preset ships, strongly implying Vite 8) |
| A3 | `@tauri-apps/plugin-store` chosen over `localStorage` for persistence | Confirm store plugin acceptable; else fall back to `localStorage` (drop `detect.ts` store calls) |
| A4 | **oxlint has no Lingui rule** — no in-editor missing-key lint | Rely on `i18n:ci` (extract --clean) + parity test; optionally run a minimal ESLint pass with `eslint-plugin-lingui` in CI only |
| A5 | Explicit-ID policy (vs auto-hashed IDs) | Locked in for rename safety; document "always pass `id`" so devs don't mix policies |
| A6 | Vitest needs the macro transform configured | Add the Lingui Babel/SWC transform to Vitest, else `Trans` renders untranslated in tests |
| R1 | Async OS detection can flash source locale on cold start | `await activateLocale(await detectInitialLocale())` **before** `createRoot().render()` (§4.1) |
| R2 | Chinese-source literals require authoring an English `message` during migration | Budget ~1 focused day for 30 components; extract's empty-entry report is the worklist |
| R3 | Macro/toolchain coupling to Vite/Rolldown on a long roadmap | Low: `@lingui/core` runtime is decoupled; only the build transform tracks Vite |
| R4 | `.po` chosen over `.json` | `.po` gives translator tooling + gettext parity; switch `format: "json"` if preferred with no code change |
| R5 | Rust-side plugin registration + capabilities for `os`/`store` | Register `tauri_plugin_os` / `tauri_plugin_store`; add `os:allow-locale` + `store` perms to `src-tauri/capabilities` |

Sources: [Lingui Vite plugin docs](https://lingui.dev/ref/vite-plugin), [@lingui/vite-plugin (npm)](https://www.npmjs.com/package/@lingui/vite-plugin), [Lingui installation](https://lingui.dev/installation), [Tauri v2 OS plugin — `locale()`](https://v2.tauri.app/reference/javascript/os/).
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'

const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // @vitejs/plugin-react v6 (Vite 8 / Rolldown) is Oxc-based and no longer
    // accepts a `babel` option. The Lingui macro transform therefore runs as a
    // dedicated @rolldown/plugin-babel pass (order: react → lingui → babel), the
    // configuration verified against https://lingui.dev/ref/vite-plugin.
    react(),
    // Compiles `src/locales/**/messages.po` on the fly (no separate `lingui
    // compile` in dev); reads `lingui.config.ts`.
    lingui(),
    // Transforms `@lingui/*/macro` usages at compile time. No-op until strings
    // are wrapped, so it is inert while catalogs are empty.
    babel({ presets: [linguiTransformerBabelPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  worker: {
    format: 'es',
  },
  // Tauri expects a fixed port and ignores its own source dir while watching.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})

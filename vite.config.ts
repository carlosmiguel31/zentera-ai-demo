import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // `node-server` gera `.output/server/index.mjs`, executado na VPS Debian
    // com `HOST` e `PORT` vindos do ambiente.
    nitro({ preset: 'node-server' }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

import { defineConfig } from 'vite'
import { resolve } from 'path'

// Trình duyệt nói chuyện với backend qua /ws của chính Vite (proxy → :4001)
const shared = {
  host: true,
  proxy: { '/ws': { target: `ws://localhost:${process.env.GUNB_PORT ?? 4001}`, ws: true } },
}

export default defineConfig({
  publicDir: resolve(__dirname, '../assets'),   // assets/maps/... phục vụ ở /maps/...
  server: { ...shared, port: 4000 },
  preview: { ...shared, port: 4173 },
  resolve: {
    alias: { '@gunb/shared': resolve(__dirname, '../shared/src/index.ts') },
  },
})

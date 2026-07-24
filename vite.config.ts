import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// URL du backend en développement. Surchargeable via VITE_API_PROXY_TARGET.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Le front appelle des URLs relatives « /api/... » (voir src/api/client.ts) :
    // Vite les relaie vers le backend. Requêtes same-origin => plus aucun souci
    // de CORS ni de résolution localhost/127.0.0.1/IPv6 dans le navigateur.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

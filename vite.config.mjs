import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // true: limpia dist/ en cada build para no acumular chunks viejos (que además
    // pueden contener secretos de bundles previos). public/ + index.html regeneran
    // todo el contenido top-level, así que es seguro.
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    // En Windows el watcher de Vite choca con archivos bloqueados de .netlify
    // (EBUSY) al correr `netlify dev`. Ignoramos esas carpetas generadas.
    watch: {
      ignored: ['**/.netlify/**', '**/dist/**'],
    },
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  test: {
    // Só funções puras (lib/): não precisa de DOM.
    environment: 'node',
    include: ['src/**/*.test.js']
  },
  server: {
    port: 5173,
    // No container (docker compose --profile dev) o proxy vai para o api-dev e o watch usa polling.
    watch: process.env.VITE_POLL ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      '/api': process.env.API_PROXY || 'http://127.0.0.1:8080'
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // No container (docker compose --profile dev) o proxy vai para o api-dev e o watch usa polling.
    watch: process.env.VITE_POLL ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      '/api': process.env.API_PROXY || 'http://127.0.0.1:8080'
    }
  }
})

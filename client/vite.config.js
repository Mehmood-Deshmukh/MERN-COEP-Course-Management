import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

const backendHost = process.env.BACKEND_HOST || 'http://server:5000'

export default defineConfig({
  server: {
    host: '0.0.0.0',   
    port: 5173,
    watch: {
      usePolling: true 
    },
    proxy: {
      '/api': {
        target: backendHost,
        changeOrigin: true,
      },
    },
  },
  plugins: [tailwind(), react()],
})

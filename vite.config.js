// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,        // puedes cambiarlo si ya usas ese puerto
    strictPort: true,  // falla si el puerto está ocupado (útil para no confundir instancias)
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // tu backend
        changeOrigin: true,
        secure: false,
        ws: true, // habilita proxy para websockets si los usas
        // rewrite: (path) => path.replace(/^\/api/, '/api'), // normalmente no hace falta
      },
    },
  },
  // Opcional: que el proxy funcione también en `npm run preview`
  preview: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})

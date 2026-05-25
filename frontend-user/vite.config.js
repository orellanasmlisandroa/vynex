import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración del frontend-user (Puerto 3003)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    strictPort: true,
    host: true, // Permitir acceso desde la red local (celular)
    // Soporte para rutas SPA (reescribe todas las rutas al index.html)
    historyApiFallback: true,
    proxy: {
      // Proxy opcional al backend para evitar problemas de CORS en desarrollo
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});

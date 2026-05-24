import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para el puerto comercial: 3002
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
  }
});

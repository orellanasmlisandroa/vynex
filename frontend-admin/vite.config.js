import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración para el puerto de administración: 3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
  }
});

/**
 * Configuración global dinámica para el frontend.
 * Permite cambiar la URL del backend mediante variables de entorno (ej: en Vercel)
 * o automáticamente caer en localhost para desarrollo local.
 */

export const getBackendUrl = () => {
  // Intentar leer de las variables de entorno de Vite
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api/v1', '');
  }
  return 'http://localhost:5000';
};

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:5000/api/v1';
};

import { useContext } from 'react';
import { AuthContext } from '../core/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export const useApi = () => {
  const { token, logout } = useContext(AuthContext);

  const request = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Configurar cabeceras por defecto e inyectar el token JWT si está disponible
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Control de token expirado o accesos prohibidos
      if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Token no válido o sesión expirada. Cerrando sesión...');
        logout();
        throw new Error('Sesión no autorizada');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      return data;
    } catch (err) {
      console.error(`❌ API Error [${endpoint}]:`, err.message);
      throw err;
    }
  };

  return { request };
};

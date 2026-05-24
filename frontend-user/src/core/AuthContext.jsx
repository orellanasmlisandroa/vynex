import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vynex_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detectar si venimos de una redirección OAuth de Google con credenciales en la URL
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    const queryRefreshToken = params.get('refreshToken');
    const queryUser = params.get('user');

    if (queryToken && queryUser) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(queryUser));
        localStorage.setItem('vynex_token', queryToken);
        if (queryRefreshToken) {
          localStorage.setItem('vynex_refresh_token', queryRefreshToken);
        }
        localStorage.setItem('vynex_user', JSON.stringify(decodedUser));
        
        // Limpiar los parámetros de la URL para evitar que se queden visibles y expuestos
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setToken(queryToken);
        setUser(decodedUser);
        setLoading(false);
        return;
      } catch (err) {
        console.error('Error al procesar los datos de inicio de sesión con Google:', err);
      }
    }

    const savedUser = localStorage.getItem('vynex_user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, [token]);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('vynex_token', accessToken);
    localStorage.setItem('vynex_refresh_token', refreshToken);
    localStorage.setItem('vynex_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vynex_token');
    localStorage.removeItem('vynex_refresh_token');
    localStorage.removeItem('vynex_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

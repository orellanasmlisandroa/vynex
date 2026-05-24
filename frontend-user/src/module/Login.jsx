import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const { request } = useApi();

  const [email, setEmail] = useState('user@vynex.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const oauthError = queryParams.get('error');
    if (oauthError) {
      if (oauthError === 'token_exchange_failed') {
        setError('No se pudo intercambiar el token de Google. Inténtalo de nuevo.');
      } else if (oauthError === 'user_info_failed') {
        setError('No se pudo obtener la información de perfil de Google.');
      } else if (oauthError === 'oauth_exception') {
        setError('Ocurrió una excepción durante el proceso de autenticación con Google.');
      } else {
        setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
      }
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (res.success) {
        login(res.user, res.token, res.refreshToken);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Pasar el origen dinámico del frontend actual (sea local o en Vercel)
    window.location.href = `http://localhost:5000/api/v1/auth/google?from=${encodeURIComponent(window.location.origin)}`;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>VYNEX</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Panel de Tareas y Seguimiento</p>
        </div>

        {error && (
          <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', background: 'hsla(355, 85%, 55%, 0.1)' }}>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn btn-secondary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.03)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.59.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.463.896 11.428 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.164 6.656 3.58 9 3.58z" />
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

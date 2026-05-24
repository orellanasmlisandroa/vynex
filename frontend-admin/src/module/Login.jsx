import React, { useState, useContext } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const { request } = useApi();

  const [email, setEmail] = useState('admin@vynex.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', padding: '1rem' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>VYNEX</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Consola de Administración</p>
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
      </div>
    </div>
  );
};

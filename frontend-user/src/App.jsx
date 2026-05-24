import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, AuthContext } from './core/AuthContext';
import { Login } from './module/Login';
import { Dashboard } from './module/Dashboard';
import { PublicCard } from './module/PublicCard';

// ─────────────────────────────────────────────────
// Componente de pantalla de carga
// ─────────────────────────────────────────────────
const LoadingScreen = ({ message = 'Verificando sesión...' }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: 'var(--bg-deep)',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '48px', height: '48px',
      border: '3px solid rgba(124, 58, 237, 0.15)',
      borderTop: '3px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span className="gradient-text" style={{ fontSize: '1rem', fontWeight: '600' }}>{message}</span>
  </div>
);

// ─────────────────────────────────────────────────
// Tarjeta pública: extrae el slug de la URL vía useParams
// ─────────────────────────────────────────────────
const PublicCardRoute = () => {
  const { slug } = useParams();
  return <PublicCard cardIdOrSlug={slug} />;
};

// ─────────────────────────────────────────────────
// Ruta raíz: redirige según estado de autenticación
// ─────────────────────────────────────────────────
const RootRedirect = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

// ─────────────────────────────────────────────────
// Ruta de login: protegida inversamente (si ya está autenticado, va al dashboard)
// ─────────────────────────────────────────────────
const LoginRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
};

// ─────────────────────────────────────────────────
// Ruta protegida: requiere autenticación
// ─────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ─────────────────────────────────────────────────
// Página 404
// ─────────────────────────────────────────────────
const NotFound = () => (
  <div style={{
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', backgroundColor: '#0b0f19',
    color: '#fff', padding: '2rem', textAlign: 'center'
  }}>
    <div className="glass-panel" style={{ padding: '3rem 2rem', maxWidth: '420px', width: '100%' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }} className="gradient-text">
        Página no encontrada
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
        La ruta que intentas acceder no existe en la plataforma VYNEX.
      </p>
      <a
        href="/dashboard"
        className="btn btn-primary"
        style={{ display: 'inline-block', textDecoration: 'none', padding: '0.85rem 2.5rem' }}
      >
        ← Ir al Panel
      </a>
    </div>
  </div>
);

// ─────────────────────────────────────────────────
// Definición de rutas de la aplicación
// ─────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Tarjeta digital pública (acceso sin autenticación) */}
    <Route path="/card/:slug" element={<PublicCardRoute />} />

    {/* Autenticación */}
    <Route path="/login" element={<LoginRoute />} />

    {/* Panel principal protegido */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/*"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    {/* Raíz: redirige según autenticación */}
    <Route path="/" element={<RootRedirect />} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// ─────────────────────────────────────────────────
// Componente principal con providers
// ─────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

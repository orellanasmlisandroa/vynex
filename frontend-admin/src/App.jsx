import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './core/AuthContext';
import { Login } from './module/Login';
import { Dashboard } from './module/Dashboard';

const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-deep)' }}>
        <h2 className="gradient-text">Verificando Credenciales VYNEX...</h2>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';

export const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { request } = useApi();

  const [usersList, setUsersList] = useState([]);
  const [flowsList, setFlowsList] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedUser, setSelectedUser] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError('');
      // Obtener datos concurrentes del servidor
      const usersData = await request('/admin/users');
      const flowsData = await request('/flows');
      const metricsData = await request('/metrics');

      if (usersData.success) setUsersList(usersData.users);
      if (flowsData.success) setFlowsList(flowsData.flows);
      if (metricsData.success) setMetrics(metricsData.metrics);
    } catch (err) {
      setError('Error al recuperar datos del panel. Verifique el backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-actualizar cada 15 segundos para dar sensación de tiempo real
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const res = await request('/admin/users/role', {
        method: 'POST',
        body: JSON.stringify({ userId: selectedUser, newRole })
      });
      if (res.success) {
        alert(res.message);
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error al modificar el rol: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      const res = await request('/flows', {
        method: 'POST',
        body: JSON.stringify({ flowName: 'Sincronización manual de Repositorio GitHub' })
      });
      if (res.success) {
        alert('Automatización Stitch disparada con éxito. Se procesa en segundo plano.');
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error de automatización: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 className="gradient-text">Cargando Panel VYNEX...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Barra Lateral Premium */}
      <aside className="sidebar">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>VYNEX</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Módulo Admin Active</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', border: 'none', background: 'hsla(222, 28%, 6%, 0.4)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuario conectado:</p>
            <h4 style={{ margin: '0.25rem 0', color: 'var(--secondary)' }}>{user.username}</h4>
            <span className="badge badge-admin">{user.role}</span>
          </div>
        </div>

        <div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área de Trabajo Principal */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="gradient-text" style={{ fontSize: '2.2rem' }}>Panel de Control Total</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Módulos del Core, Procesos de Stitch e Integración GitHub remota.</p>
          </div>
          <div>
            <button onClick={handleTriggerSync} className="btn btn-glow-cyan">
              ⚡ Sincronizar Repositorio
            </button>
          </div>
        </header>

        {error && (
          <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {/* Rejilla de Métricas en Tiempo Real */}
        <section className="dashboard-grid" style={{ marginTop: '2rem' }}>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Peticiones Totales (REST)</span>
            <div className="metric-val gradient-text">{metrics?.serverStats?.totalRequests || 0}</div>
          </div>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Clientes WebSocket</span>
            <div className="metric-val" style={{ color: 'var(--secondary)' }}>
              {metrics?.serverStats?.activeConnections || 0} <span className="pulse-indicator" style={{ marginLeft: '10px' }}></span>
            </div>
          </div>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Flujos Completados</span>
            <div className="metric-val" style={{ color: 'var(--success)' }}>{metrics?.serverStats?.completedFlows || 0}</div>
          </div>
        </section>

        {/* Panel de Gestión de Usuarios */}
        <section style={{ marginTop: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>👥 Gestión de Roles de Usuarios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Lista de usuarios */}
            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Username</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid hsla(222, 28%, 20%, 0.3)' }}>
                      <td style={{ padding: '0.75rem' }}>{u.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Formulario de Modificación de Rol */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Modificar Permisos</h4>
              <form onSubmit={handleUpdateRole}>
                <div className="form-group">
                  <label className="form-label">Seleccionar Usuario</label>
                  <select 
                    className="form-control" 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                    required
                  >
                    <option value="">-- Elige un usuario --</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nuevo Rol</label>
                  <select 
                    className="form-control" 
                    value={newRole} 
                    onChange={(e) => setNewRole(e.target.value)}
                    required
                  >
                    <option value="USER">USER</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={actionLoading || !selectedUser}
                >
                  Actualizar Rol
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Panel de Flujos Activos */}
        <section style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔄 Historial de Flujos y Automatización Stitch</h3>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {flowsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Ningún flujo registrado en el bus.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {flowsList.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', background: 'hsla(222, 28%, 6%, 0.3)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <h4 style={{ color: 'var(--text-primary)' }}>{f.name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ejecutado por: <strong style={{ color: 'var(--text-secondary)' }}>{f.triggered_by}</strong> | {new Date(f.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className={`badge ${f.status === 'COMPLETED' ? 'badge-business' : f.status === 'PENDING' ? 'badge-user' : 'badge-admin'}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

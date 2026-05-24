import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';

export const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { request } = useApi();

  const [flowsList, setFlowsList] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBusinessData = async () => {
    try {
      setError('');
      const flowsData = await request('/flows');
      const metricsData = await request('/metrics');

      if (flowsData.success) setFlowsList(flowsData.flows);
      if (metricsData.success) setMetrics(metricsData.metrics);
    } catch (err) {
      setError('Error al recuperar datos operacionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
    const interval = setInterval(fetchBusinessData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerFlow = async (flowName) => {
    setActionLoading(true);
    try {
      const res = await request('/flows', {
        method: 'POST',
        body: JSON.stringify({ 
          flowName,
          payload: { timestamp: new Date(), client: 'VYNEX Business Portal' }
        })
      });
      if (res.success) {
        alert(`Flujo "${flowName}" enviado a Stitch con éxito.`);
        fetchBusinessData();
      }
    } catch (err) {
      alert(`Error al invocar la automatización: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 className="gradient-text">Cargando Operaciones Comerciales...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar de Operaciones */}
      <aside className="sidebar">
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>VYNEX</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Módulo Business Active</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', border: 'none', background: 'hsla(222, 28%, 6%, 0.4)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuario comercial:</p>
            <h4 style={{ margin: '0.25rem 0', color: 'var(--secondary)' }}>{user.username}</h4>
            <span className="badge badge-business">{user.role}</span>
          </div>
        </div>

        <div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="gradient-text" style={{ fontSize: '2.2rem' }}>Panel de Métricas y Flujos</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Consola de control operativo y automatizaciones automáticas de Stitch.</p>
          </div>
        </header>

        {error && (
          <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {/* Dashboard Cards grid */}
        <section className="dashboard-grid" style={{ marginTop: '2rem' }}>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Peticiones de Servidor</span>
            <div className="metric-val" style={{ color: 'var(--secondary)' }}>{metrics?.serverStats?.totalRequests || 0}</div>
          </div>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Conexiones Activas WS</span>
            <div className="metric-val" style={{ color: 'var(--primary)' }}>
              {metrics?.serverStats?.activeConnections || 0} <span className="pulse-indicator" style={{ marginLeft: '10px' }}></span>
            </div>
          </div>
          <div className="glass-panel metric-card">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Procesos Ejecutados en Stitch</span>
            <div className="metric-val" style={{ color: 'var(--success)' }}>{flowsList.length}</div>
          </div>
        </section>

        {/* Disparadores de Flujos y Automatización */}
        <section style={{ marginTop: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>⚡ Despachar Automatizaciones en Stitch</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyStyle: 'stretch', gap: '1rem' }}>
              <div>
                <h4>Auditoría Completa de Logs</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Exporta logs de peticiones y métricas en formato JSON agregados a la carpeta compartida /docs.
                </p>
              </div>
              <button 
                onClick={() => handleTriggerFlow('Generar reporte de logs consolidados')} 
                className="btn btn-primary"
                disabled={actionLoading}
                style={{ marginTop: 'auto' }}
              >
                Ejecutar Auditoría
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyStyle: 'stretch', gap: '1rem' }}>
              <div>
                <h4>Métricas de Productividad</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Evalúa recuentos de tareas y tiempos de respuesta de los desarrolladores asignados al entorno.
                </p>
              </div>
              <button 
                onClick={() => handleTriggerFlow('Consolidación de métricas de productividad')} 
                className="btn btn-glow-cyan"
                disabled={actionLoading}
                style={{ marginTop: 'auto' }}
              >
                Compilar Métricas
              </button>
            </div>
          </div>
        </section>

        {/* Historial de flujos */}
        <section style={{ marginTop: '3rem', marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 Tareas de Automatización en Progreso</h3>
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
                        Trigger: <strong style={{ color: 'var(--text-secondary)' }}>{f.triggered_by}</strong> | {new Date(f.timestamp).toLocaleTimeString()}
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

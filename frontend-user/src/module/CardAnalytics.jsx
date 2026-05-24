import React, { useEffect, useState } from 'react';
import { useApi } from '../process/useApi';
import { getApiBaseUrl } from '../core/config';

const API_BASE_URL = getApiBaseUrl();

export const CardAnalytics = () => {
  const { request } = useApi();

  const [hasCard, setHasCard] = useState(false);
  const [card, setCard] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setError('');
      const res = await request('/card/analytics');
      if (res.success) {
        setHasCard(res.hasCard);
        if (res.hasCard) {
          setCard(res.card);
          setAnalytics(res.analytics);
          setLeads(res.leads);
        }
      }
    } catch (err) {
      setError('Fallo al recuperar analíticas. Verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Calcular agregados de analíticas
  const totalVisits = analytics.find(a => a.event_type === 'visit')?.count || 0;
  const qrScans = analytics.find(a => a.event_type === 'qr_scan')?.count || 0;
  
  // Sumar clics en redes sociales y botones personalizados
  const totalClicks = analytics
    .filter(a => a.event_type === 'click_button' || a.event_type === 'click_social')
    .reduce((sum, current) => sum + (current.count || 0), 0);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ card, analytics, leads }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vynex_card_export_${card?.slug || 'data'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="gradient-text">Cargando Estadísticas...</h2>
      </div>
    );
  }

  if (!hasCard) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', textAlign: 'center', padding: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px' }}>
          <h3>📋 Tarjeta no inicializada</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', marginBottom: '1.5rem' }}>
            Aún no has creado tu tarjeta de presentación digital VYNEX. Ve a la pestaña "Personalizar" para inicializarla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2.2rem' }}>Leads & Analíticas de Tarjeta</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Telemetría detallada de visitas y lista de contactos de prospección comercial.</p>
        </div>
        
        {/* Botones de Exportación */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href={`${API_BASE_URL}/card/export/leads?token=jwt`} download className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            📥 Exportar Leads (CSV)
          </a>
          <a href={`${API_BASE_URL}/card/export/analytics?token=jwt`} download className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            📊 Exportar Clics (CSV)
          </a>
          <button onClick={handleExportJson} className="btn btn-glow-cyan" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            ⚙️ Exportar Completo (JSON)
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Grid de Contadores Analíticos */}
      <section className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Visitas al Perfil</span>
          <div className="metric-val gradient-text">{totalVisits}</div>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Escaneos Código QR</span>
          <div className="metric-val" style={{ color: 'var(--secondary)' }}>{qrScans}</div>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Clics en Enlaces</span>
          <div className="metric-val" style={{ color: 'var(--primary)' }}>{totalClicks}</div>
        </div>
        <div className="glass-panel metric-card">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Leads Capturados</span>
          <div className="metric-val" style={{ color: 'var(--success)' }}>{leads.length}</div>
        </div>
      </section>

      {/* DETALLE DE CLICS POR BOTÓN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', alignItems: 'start', marginBottom: '2.5rem' }}>
        
        {/* Tabla de leads */}
        <section className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--secondary)' }}>📬 Leads Capturados (Formularios)</h3>
          {leads.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Aún no has recibido ningún lead desde tu tarjeta pública.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nombre</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email / Tel</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mensaje</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid hsla(222, 28%, 20%, 0.3)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', fontSize: '0.85rem' }}>{l.name}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                      {l.email}<br />
                      <span style={{ color: 'var(--text-muted)' }}>{l.phone || 'Sin tel.'}</span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.message}>
                      {l.message || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(l.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Clics analíticos individuales */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>📊 Clicks por Enlaces y Redes</h3>
          {analytics.filter(a => a.event_type !== 'visit' && a.event_type !== 'qr_scan').length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No se registran clics en tus enlaces.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {analytics
                .filter(a => a.event_type !== 'visit' && a.event_type !== 'qr_scan')
                .map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'hsla(222, 28%, 6%, 0.25)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {a.event_type === 'click_social' ? `Red Social: ${a.social_id}` : `Botón: ${a.button_id}`}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Tipo: {a.event_type} | Actualizado: {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="badge badge-business" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {a.count} clics
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

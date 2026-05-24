import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../core/config';

const API_BASE_URL = getApiBaseUrl();

export const PublicCard = ({ cardIdOrSlug }) => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulario de Captura de Leads
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);

  // Obtener slug de la URL si no viene por props
  const slug = cardIdOrSlug || window.location.pathname.split('/').pop() || 'user-dev';

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/card/public/${slug}`);
        const data = await response.json();
        if (data.success) {
          setCard(data.card);
        } else {
          setError(data.message || 'Tarjeta digital no encontrada.');
        }
      } catch (err) {
        setError('Error de comunicación con el servidor de tarjetas.');
      } finally {
        setLoading(false);
      }
    };
    fetchCardData();
  }, [slug]);

  const handleRegisterClick = async (eventType, itemId) => {
    try {
      await fetch(`${API_BASE_URL}/card/public/${slug}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, itemId })
      });
    } catch (e) {
      console.warn('Fallo al registrar telemetría de clic.');
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadStatus('');
    setSubmittingLead(true);

    try {
      const response = await fetch(`${API_BASE_URL}/card/public/${slug}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          message: leadMessage
        })
      });
      const data = await response.json();

      if (data.success) {
        setLeadStatus('success');
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadMessage('');
        handleRegisterClick('click_button', 'lead_form_submitted');
      } else {
        setLeadStatus('error');
      }
    } catch (err) {
      setLeadStatus('error');
    } finally {
      setSubmittingLead(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: '#fff' }}>
        <h2 className="gradient-text">Cargando Tarjeta VYNEX...</h2>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b0f19', color: '#fff', padding: '1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⚠️ Oops!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'La tarjeta solicitada no existe o ha sido dada de baja.'}</p>
        </div>
      </div>
    );
  }

  const { theme } = card;

  // Renderizar estilos e inyecciones de tema en caliente
  const cardStyle = {
    fontFamily: theme?.fontFamily || 'var(--font-body)',
    backgroundColor: theme?.bgColor || 'var(--bg-deep)',
    backgroundImage: `linear-gradient(180deg, ${theme?.primaryColor || 'var(--primary-glow)'} 0%, transparent 400px)`,
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem',
    color: '#fff'
  };

  const containerStyle = {
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  };

  return (
    <div style={cardStyle}>
      <div style={containerStyle}>
        
        {/* CABECERA DE PERFIL (Glassmorphism card) */}
        <header className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: theme?.cardBg }}>
          {card.avatar_url && (
            <img 
              src={card.avatar_url} 
              alt={card.name} 
              style={{ width: '120px', height: '120px', borderRadius: '50%', border: `3px solid ${theme?.primaryColor || 'var(--primary)'}`, boxShadow: '0 0 15px rgba(0,0,0,0.5)', objectFit: 'cover', marginBottom: '1.5rem' }} 
            />
          )}
          
          <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{card.name}</h2>
          <p style={{ color: theme?.secondaryColor || 'var(--secondary)', fontWeight: '600', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.job_title}</p>
          {card.company && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.1rem' }}>🏢 {card.company}</p>}
          
          {card.bio && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1.25rem', padding: '0 0.5rem', lineHeight: '1.5' }}>
              {card.bio}
            </p>
          )}

          {/* Botones de acción principales (Guardar y Wallet) */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
            <a 
              href={`${API_BASE_URL}/card/public/${slug}/vcard`} 
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '0.85rem', padding: '0.65rem 1rem', background: `linear-gradient(135deg, ${theme?.primaryColor || 'var(--primary)'} 0%, ${theme?.accentColor || 'var(--accent)'} 100%)` }}
            >
              📥 Guardar Contacto
            </a>
            <a 
              href={`${API_BASE_URL}/card/public/${slug}/wallet`}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.85rem', padding: '0.65rem 1rem', border: '1px solid var(--border-glass)' }}
              onClick={() => handleRegisterClick('click_button', 'wallet_pass')}
            >
              💳 Apple Wallet
            </a>
          </div>
        </header>

        {/* REDES SOCIALES OFICIALES */}
        {card.socials && Object.keys(card.socials).length > 0 && (
          <section className="glass-panel" style={{ padding: '1.25rem', background: theme?.cardBg, display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {Object.entries(card.socials).map(([net, url]) => {
              if (!url) return null;
              
              // Mapeo básico de emojis/iconos dinámicos
              const iconMap = {
                linkedin: '💼 LinkedIn',
                x: '𝕏',
                instagram: '📸 Instagram',
                github: '🐙 GitHub',
                youtube: '📺 YouTube',
                facebook: '📘 Facebook'
              };

              return (
                <a 
                  key={net} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => handleRegisterClick('click_social', net)}
                  className="badge" 
                  style={{
                    backgroundColor: 'hsla(222, 28%, 6%, 0.4)',
                    borderColor: 'var(--border-glass)',
                    color: 'var(--text-primary)',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {iconMap[net] || net}
                </a>
              );
            })}
          </section>
        )}

        {/* CONTACTO DE MENSAJERÍA DIRECTA */}
        {card.messengers && Object.keys(card.messengers).length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {card.messengers.whatsapp && (
              <a 
                href={card.messengers.whatsapp} 
                target="_blank" 
                rel="noreferrer"
                className="glass-panel btn"
                style={{ padding: '1rem', background: 'rgba(37, 211, 102, 0.1)', borderColor: 'rgba(37, 211, 102, 0.3)', color: '#25D366', fontSize: '0.9rem', fontWeight: 'bold' }}
                onClick={() => handleRegisterClick('click_button', 'whatsapp')}
              >
                💬 WhatsApp
              </a>
            )}
            {card.messengers.telegram && (
              <a 
                href={card.messengers.telegram} 
                target="_blank" 
                rel="noreferrer"
                className="glass-panel btn"
                style={{ padding: '1rem', background: 'rgba(0, 136, 204, 0.1)', borderColor: 'rgba(0, 136, 204, 0.3)', color: '#0088cc', fontSize: '0.9rem', fontWeight: 'bold' }}
                onClick={() => handleRegisterClick('click_button', 'telegram')}
              >
                ✈️ Telegram
              </a>
            )}
          </section>
        )}

        {/* MARKETPLACES Y TIENDAS */}
        {card.marketplaces && Object.keys(card.marketplaces).length > 0 && (
          <section className="glass-panel" style={{ padding: '1.5rem', background: theme?.cardBg }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: theme?.secondaryColor || 'var(--secondary)' }}>🛒 Mis Tiendas & Catálogos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(card.marketplaces).map(([store, url]) => {
                if (!url) return null;
                const storeNames = { shopify: '🛍️ Shopify Store', amazon: '📦 Amazon Storefront', etsy: '🎨 Etsy Shop' };
                return (
                  <a 
                    key={store} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', fontSize: '0.9rem', padding: '0.75rem 1rem' }}
                    onClick={() => handleRegisterClick('click_button', `store_${store}`)}
                  >
                    {storeNames[store] || store}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ENLACES Y BOTONES PERSONALIZADOS */}
        {card.buttons && card.buttons.length > 0 && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {card.buttons.map((btn) => (
              <a 
                key={btn.id} 
                href={btn.url} 
                target="_blank" 
                rel="noreferrer"
                className="glass-panel btn"
                style={{ 
                  padding: '1.1rem 1.5rem', 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  borderColor: 'var(--border-glass)',
                  background: 'hsla(222, 28%, 20%, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleRegisterClick('click_button', btn.id)}
              >
                🔗 {btn.label}
              </a>
            ))}
          </section>
        )}

        {/* CAPTURA DE LEADS (FORMULARIO) */}
        <section className="glass-panel" style={{ padding: '2rem 1.5rem', background: theme?.cardBg }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>📬 Escríbeme un mensaje</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Completa tus datos y me pondré en contacto contigo a la brevedad.</p>
          
          {leadStatus === 'success' && (
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: '1.25rem' }}>
              <p style={{ color: 'var(--success)', fontSize: '0.85rem', textAlign: 'center' }}>¡Prospecto enviado correctamente! Gracias por contactar.</p>
            </div>
          )}

          {leadStatus === 'error' && (
            <div className="glass-panel" style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '1.25rem' }}>
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>Error al enviar datos. Inténtalo de nuevo.</p>
            </div>
          )}

          <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre Completo</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Juan Pérez"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Correo Electrónico</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="juan@correo.com"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Teléfono (Opcional)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="+503 7000-0000"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Mensaje</label>
              <textarea 
                className="form-control" 
                rows="3"
                placeholder="Escribe tu consulta aquí..."
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                style={{ resize: 'none' }}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-glow-cyan" 
              style={{ marginTop: '0.5rem', background: `linear-gradient(135deg, ${theme?.secondaryColor || 'var(--secondary)'} 0%, ${theme?.primaryColor || 'var(--primary)'} 100%)` }}
              disabled={submittingLead}
            >
              {submittingLead ? 'Enviando...' : 'Enviar Mensaje'}
            </button>
          </form>
        </section>

        {/* PIE DE PÁGINA (Footer) */}
        <footer style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.75rem', marginTop: '1rem' }}>
          <p>© 2026 VYNEX DIGITAL CARD. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

import React, { useState } from 'react';

export const OnboardingWizard = ({ user, isOpen, onComplete, request }) => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Perfil
  const [slug, setSlug] = useState((user?.username || 'mi-tarjeta').toLowerCase().replace(/[^a-z0-9]/g, '-'));
  const [name, setName] = useState(user?.username || '');
  const [jobTitle, setJobTitle] = useState('Consultor de Tecnología');
  const [company, setCompany] = useState('Vynex Tech');
  const [bio, setBio] = useState('Apasionado por la innovación y la transformación digital.');
  
  // Step 2: Diseño (presets)
  const themePresets = [
    {
      id: 'cyber',
      name: 'Cyber Neon (Morado)',
      bgColor: '#0b0f19',
      primaryColor: '#7c3aed',
      secondaryColor: '#06b6d4',
      accentColor: '#db2777',
      cardBg: 'rgba(17, 25, 40, 0.65)'
    },
    {
      id: 'aqua',
      name: 'Aqua Dream (Cian)',
      bgColor: '#060b13',
      primaryColor: '#06b6d4',
      secondaryColor: '#10b981',
      accentColor: '#f59e0b',
      cardBg: 'rgba(12, 23, 42, 0.7)'
    },
    {
      id: 'sunset',
      name: 'Sunset Glow (Fucsia)',
      bgColor: '#0f0814',
      primaryColor: '#ec4899',
      secondaryColor: '#f43f5e',
      accentColor: '#eab308',
      cardBg: 'rgba(23, 10, 30, 0.7)'
    },
    {
      id: 'emerald',
      name: 'Emerald Space (Verde)',
      bgColor: '#050e0c',
      primaryColor: '#10b981',
      secondaryColor: '#06b6d4',
      accentColor: '#84cc16',
      cardBg: 'rgba(8, 23, 18, 0.7)'
    }
  ];
  const [selectedTheme, setSelectedTheme] = useState(themePresets[0]);

  // Step 3: Redes
  const [linkedin, setLinkedin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!slug || !name) {
        setError('El identificador URL (Slug) y tu Nombre son requeridos.');
        return;
      }
      setError('');
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');

    const payload = {
      slug,
      name,
      job_title: jobTitle,
      company,
      bio,
      phone: '',
      email: user?.email || '',
      address: '',
      avatar_url: '',
      logo_url: '',
      socials: {
        linkedin: linkedin ? (linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`) : '',
        x: '',
        instagram: '',
        github: ''
      },
      messengers: {
        whatsapp: whatsapp ? (whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`) : '',
        telegram: ''
      },
      marketplaces: {
        shopify: '',
        amazon: ''
      },
      buttons: [],
      theme: {
        mode: 'dark',
        bgColor: selectedTheme.bgColor,
        cardBg: selectedTheme.cardBg,
        primaryColor: selectedTheme.primaryColor,
        secondaryColor: selectedTheme.secondaryColor,
        accentColor: selectedTheme.accentColor,
        fontFamily: 'Outfit'
      }
    };

    try {
      const res = await request('/card/my', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        onComplete();
      }
    } catch (err) {
      setError(err.message || 'Error al inicializar la tarjeta. Prueba con otro slug.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.9)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '3rem 2.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), var(--shadow-glow)',
        border: '1px solid var(--border-glass-glow)'
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-user" style={{ marginBottom: '0.75rem', fontSize: '0.7rem' }}>Onboarding VYNEX</span>
          <h2 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>¡Bienvenido a VYNEX! 🚀</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Inicialicemos tu Tarjeta Digital Profesional en menos de 1 minuto.
          </p>
        </div>

        {/* Indicador de Pasos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border-glass)', zIndex: 1 }}></div>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: step >= s ? 'var(--primary)' : 'var(--bg-deep)',
              border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border-glass)'}`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              zIndex: 2,
              boxShadow: step >= s ? '0 0 10px var(--primary-glow)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {s}
            </div>
          ))}
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', background: 'hsla(355, 85%, 55%, 0.1)' }}>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Contenido Dinámico de Pasos */}
        <div style={{ minHeight: '260px', marginBottom: '2rem' }}>
          
          {/* PASO 1: PERFIL */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.1rem' }}>Paso 1: Tu Información Profesional</h4>
              <div className="form-group">
                <label className="form-label">Identificador URL (Slug)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, '-'))} 
                  placeholder="ej. lisandro-orellana"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Tu nombre completo"
                  required 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cargo / Profesión</label>
                  <input type="text" className="form-control" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Empresa</label>
                  <input type="text" className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Biografía Corta</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  style={{ resize: 'none' }}
                />
              </div>
            </div>
          )}

          {/* PASO 2: DISEÑO DE MARCA */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.1rem' }}>Paso 2: Branding y Paleta de Colores</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Elige el tema de colores que representará tu marca personal. Podrás cambiarlo cuando quieras.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {themePresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedTheme(preset)}
                    className="glass-panel"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: selectedTheme.id === preset.id ? 'rgba(255, 255, 255, 0.05)' : 'rgba(5, 8, 16, 0.2)',
                      borderColor: selectedTheme.id === preset.id ? 'var(--primary)' : 'var(--border-glass)',
                      boxShadow: selectedTheme.id === preset.id ? '0 0 15px rgba(124, 58, 237, 0.15)' : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Selector visual */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedTheme.id === preset.id ? 'var(--primary)' : 'var(--text-muted)'}`,
                      backgroundColor: selectedTheme.id === preset.id ? 'var(--primary)' : 'transparent',
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedTheme.id === preset.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{preset.name}</strong>
                    </div>

                    {/* Muestra de colores */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.primaryColor }} />
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.secondaryColor }} />
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.accentColor }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: REDES SOCIALES */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ color: 'var(--secondary)', margin: 0, fontSize: '1.1rem' }}>Paso 3: Tus Canales de Contacto</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Agrega tus principales canales para que los clientes y colegas se conecten contigo al instante.
              </p>
              
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Usuario o Enlace de LinkedIn</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={linkedin} 
                  onChange={(e) => setLinkedin(e.target.value)} 
                  placeholder="ej. orellanasmlisandroa" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp (Con código de país)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)} 
                  placeholder="ej. 50377771234" 
                />
              </div>

              <div className="glass-panel" style={{ padding: '1rem', background: 'hsla(190, 95%, 50%, 0.05)', borderColor: 'hsla(190, 95%, 50%, 0.15)', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  ℹ️ **¡Listo para despegar!** Al presionar finalizar, se creará tu tarjeta digital y podrás editarla o ver su código QR en cualquier momento.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Botones de Control */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          {step > 1 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={saving}
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Atrás
            </button>
          ) : (
            <div></div> // Espaciador si es el paso 1
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn btn-glow-cyan"
              onClick={handleNext}
              style={{ padding: '0.75rem 2rem' }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={saving}
              style={{ padding: '0.75rem 2rem' }}
            >
              {saving ? 'Creando...' : '🚀 Finalizar Onboarding'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../core/AuthContext';
import { useApi } from '../process/useApi';
import { getApiBaseUrl } from '../core/config';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: CameraModal (Cámara WebRTC Premium con recorte circular 1:1)
// ─────────────────────────────────────────────────────────────────────────────
const CameraModal = ({ isOpen, onClose, onCapture, title = "Capturar Foto" }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError('');
    try {
      // Usar dimensiones ideales en lugar de estrictas para maximizar la compatibilidad
      // con cámaras frontales de celulares que no soportan resoluciones cuadradas exactas
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Asegúrate de otorgar los permisos de cámara en tu navegador.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Determinar el tamaño de recorte 1:1 (cuadrado perfecto en el centro)
      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      
      canvas.width = 300;
      canvas.height = 300;
      
      // Dibujar y recortar
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
      
      // Convertir a base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(base64Image);
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <h3 className="gradient-text" style={{ marginBottom: '1rem' }}>{title}</h3>
        
        {error ? (
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', background: 'hsla(355, 85%, 55%, 0.1)' }}>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>
          </div>
        ) : (
          <div style={{
            position: 'relative',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto 1.5rem',
            border: '3px solid var(--primary)',
            boxShadow: '0 0 20px var(--primary-glow)',
            backgroundColor: '#000'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { stopCamera(); onClose(); }}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
          >
            Cancelar
          </button>
          {!error && (
            <button
              type="button"
              className="btn btn-glow-cyan"
              onClick={handleCapture}
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
            >
              📸 Capturar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: CardEditor
// ─────────────────────────────────────────────────────────────────────────────
export const CardEditor = () => {
  const { user } = useContext(AuthContext);
  const { request } = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 1. Estados del Perfil
  const [slug, setSlug] = useState('user-dev');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // 2. Estados de Redes Sociales
  const [linkedin, setLinkedin] = useState('');
  const [x, setX] = useState('');
  const [instagram, setInstagram] = useState('');
  const [github, setGithub] = useState('');

  // 3. Estados de Mensajería
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');

  // 4. Estados de Marketplaces
  const [shopify, setShopify] = useState('');
  const [amazon, setAmazon] = useState('');

  // 5. Botones Personalizados (Array de objetos)
  const [buttons, setButtons] = useState([]);
  const [newBtnLabel, setNewBtnLabel] = useState('');
  const [newBtnUrl, setNewBtnUrl] = useState('');

  // 6. Configuración de Marca (Temas)
  const [themeMode, setThemeMode] = useState('dark');
  const [themeBgColor, setThemeBgColor] = useState('#0b0f19');
  const [themeCardBg, setThemeCardBg] = useState('rgba(17, 25, 40, 0.65)');
  const [themePrimary, setThemePrimary] = useState('#7c3aed');
  const [themeSecondary, setThemeSecondary] = useState('#06b6d4');
  const [themeAccent, setThemeAccent] = useState('#db2777');
  const [themeFont, setThemeFont] = useState('Outfit');

  // 7. Modales de Cámara
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [camTarget, setCamTarget] = useState('avatar'); // 'avatar' | 'logo'

  // Recuperar tarjeta existente del usuario
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await request('/card/my');
        if (res.success && res.card) {
          const c = res.card;
          setSlug(c.slug || 'user-dev');
          setName(c.name || '');
          setJobTitle(c.job_title || '');
          setCompany(c.company || '');
          setBio(c.bio || '');
          setPhone(c.phone || '');
          setEmail(c.email || '');
          setAddress(c.address || '');
          setAvatarUrl(c.avatar_url || '');
          setLogoUrl(c.logo_url || '');
          
          setLinkedin(c.socials?.linkedin || '');
          setX(c.socials?.x || '');
          setInstagram(c.socials?.instagram || '');
          setGithub(c.socials?.github || '');

          setWhatsapp(c.messengers?.whatsapp || '');
          setTelegram(c.messengers?.telegram || '');

          setShopify(c.marketplaces?.shopify || '');
          setAmazon(c.marketplaces?.amazon || '');

          setButtons(c.buttons || []);

          if (c.theme) {
            setThemeMode(c.theme.mode || 'dark');
            setThemeBgColor(c.theme.bgColor || '#0b0f19');
            setThemeCardBg(c.theme.cardBg || 'rgba(17, 25, 40, 0.65)');
            setThemePrimary(c.theme.primaryColor || '#7c3aed');
            setThemeSecondary(c.theme.secondaryColor || '#06b6d4');
            setThemeAccent(c.theme.accentColor || '#db2777');
            setThemeFont(c.theme.fontFamily || 'Outfit');
          }
        }
      } catch (err) {
        setError('Error al recuperar la configuración de tu tarjeta.');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, []);

  const handleSaveCard = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    const cardPayload = {
      slug,
      name,
      job_title: jobTitle,
      company,
      bio,
      phone,
      email,
      address,
      avatar_url: avatarUrl,
      logo_url: logoUrl,
      socials: { linkedin, x, instagram, github },
      messengers: { whatsapp, telegram },
      marketplaces: { shopify, amazon },
      buttons,
      theme: {
        mode: themeMode,
        bgColor: themeBgColor,
        cardBg: themeCardBg,
        primaryColor: themePrimary,
        secondaryColor: themeSecondary,
        accentColor: themeAccent,
        fontFamily: themeFont
      }
    };

    try {
      const res = await request('/card/my', {
        method: 'POST',
        body: JSON.stringify(cardPayload)
      });
      if (res.success) {
        alert('¡Tarjeta digital VYNEX guardada exitosamente!');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios de la tarjeta.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddButton = () => {
    if (!newBtnLabel || !newBtnUrl) return;
    const newBtn = {
      id: `b-${Date.now()}`,
      label: newBtnLabel,
      url: newBtnUrl,
      icon: 'link'
    };
    setButtons([...buttons, newBtn]);
    setNewBtnLabel('');
    setNewBtnUrl('');
  };

  const handleRemoveButton = (id) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  // Convertir archivo a Base64
  const handleFileChange = (e, setUrl) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generar URL pública
  const publicCardUrl = `${getApiBaseUrl()}/card/public/${slug}`;
  const mockQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicCardUrl)}&color=06b6d4&bgcolor=0b0f19`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="gradient-text">Cargando Editor VYNEX CARD...</h2>
      </div>
    );
  }

  // Estilo simulado de la previsualización del teléfono
  const previewBgStyle = {
    fontFamily: themeFont,
    backgroundColor: themeBgColor,
    backgroundImage: `linear-gradient(180deg, ${themePrimary} 0%, transparent 200px)`,
    borderRadius: '32px',
    border: '8px solid #222530',
    width: '100%',
    maxWidth: '340px',
    height: '600px',
    overflowY: 'auto',
    padding: '1.5rem 1rem',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    position: 'sticky',
    top: '20px',
    color: '#fff'
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.2rem' }}>Personalizar Tarjeta Digital</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Configura tu branding, enlaces interactivos y códigos QR descargables en tiempo real.</p>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="card-editor-grid">
        
        {/* PANEL IZQUIERDO: FORMULARIO DE EDICIÓN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* SECCIÓN 1: PERFIL */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>👤 Información del Profesional</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Identificador URL (Slug)</label>
                <input type="text" className="form-control" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, '-'))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo / Profesión</label>
                <input type="text" className="form-control" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input type="text" className="form-control" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Biografía Corta</label>
                <textarea className="form-control" rows="2" value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: 'none' }}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono de Contacto</label>
                <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Profesional</label>
                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Dirección física</label>
                <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              {/* FOTO DE PERFIL CON CÁMARA Y ARCHIVO */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Foto de Perfil (Avatar)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themePrimary}` }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👤</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1 }}
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)} 
                      placeholder="Enlace URL o imagen en Base64" 
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => document.getElementById('avatar-file-input').click()}
                    >
                      📁 Archivo
                    </button>
                    <button
                      type="button"
                      className="btn btn-glow-cyan"
                      style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
                      onClick={() => { setCamTarget('avatar'); setIsCamOpen(true); }}
                    >
                      📸 Cámara
                    </button>
                  </div>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setAvatarUrl)}
                  />
                </div>
              </div>

              {/* LOGO DE EMPRESA CON CÁMARA Y ARCHIVO */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Logo de Empresa</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo Preview" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--border-glass)' }} />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: 'var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏢</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ flex: 1 }}
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="Enlace URL o imagen en Base64" 
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => document.getElementById('logo-file-input').click()}
                    >
                      📁 Archivo
                    </button>
                    <button
                      type="button"
                      className="btn btn-glow-cyan"
                      style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
                      onClick={() => { setCamTarget('logo'); setIsCamOpen(true); }}
                    >
                      📸 Cámara
                    </button>
                  </div>
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setLogoUrl)}
                  />
                </div>
              </div>
            </div>
          </section>
 
          {/* SECCIÓN 2: REDES Y MENSAJERÍA */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>🌐 Redes Sociales y Canales Oficiales</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input type="text" className="form-control" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">𝕏 (Twitter) URL</label>
                <input type="text" className="form-control" value={x} onChange={(e) => setX(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram URL</label>
                <input type="text" className="form-control" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input type="text" className="form-control" value={github} onChange={(e) => setGithub(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2', margin: '0.5rem 0' }}>
                <h4 style={{ color: 'var(--secondary)' }}>💬 Canales de Mensajería</h4>
              </div>
              
              <div className="form-group">
                <label className="form-label">WhatsApp (Enlace directo wa.me)</label>
                <input type="text" className="form-control" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/50377770000" />
              </div>
              <div className="form-group">
                <label className="form-label">Telegram Link</label>
                <input type="text" className="form-control" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/usuario" />
              </div>
            </div>
          </section>
 
          {/* SECCIÓN 3: TIENDAS Y BOTONES */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>🛒 Tiendas Online y Enlaces Personalizados</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Shopify Store URL</label>
                <input type="text" className="form-control" value={shopify} onChange={(e) => setShopify(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Amazon Storefront URL</label>
                <input type="text" className="form-control" value={amazon} onChange={(e) => setAmazon(e.target.value)} />
              </div>
            </div>
 
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🔗 Añadir Botones Personalizados</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input type="text" className="form-control" style={{ flex: 1 }} placeholder="Nombre del Botón (ej. Mi Portafolio)" value={newBtnLabel} onChange={(e) => setNewBtnLabel(e.target.value)} />
                <input type="text" className="form-control" style={{ flex: 1 }} placeholder="URL de Destino (https://...)" value={newBtnUrl} onChange={(e) => setNewBtnUrl(e.target.value)} />
                <button type="button" onClick={handleAddButton} className="btn btn-glow-cyan" style={{ fontSize: '0.85rem' }}>+ Añadir</button>
              </div>
 
              {buttons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {buttons.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'hsla(222, 28%, 6%, 0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div>
                        <strong>{b.label}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>{b.url}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveButton(b.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
 
          {/* SECCIÓN 4: BRANDING Y TEMAS */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>🎨 Configuración de Branding y Tema</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Color de Fondo</label>
                <input type="color" className="form-control" style={{ height: '42px', padding: '0.25rem' }} value={themeBgColor} onChange={(e) => setThemeBgColor(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color Primario (Neon Glow)</label>
                <input type="color" className="form-control" style={{ height: '42px', padding: '0.25rem' }} value={themePrimary} onChange={(e) => setThemePrimary(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color Secundario</label>
                <input type="color" className="form-control" style={{ height: '42px', padding: '0.25rem' }} value={themeSecondary} onChange={(e) => setThemeSecondary(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color de Acento</label>
                <input type="color" className="form-control" style={{ height: '42px', padding: '0.25rem' }} value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)} />
              </div>
            </div>
          </section>
 
          <button type="button" onClick={handleSaveCard} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={saving}>
            {saving ? 'Guardando tarjeta...' : '💾 Guardar Tarjeta Digital VYNEX'}
          </button>
        </div>
 
        {/* PANEL DERECHO: PREVISUALIZADOR MÓVIL EN TIEMPO REAL & QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          
          <h3 style={{ margin: 0 }}>📱 Previsualización en Vivo</h3>
 
          {/* SIMULADOR DE CELULAR */}
          <div style={previewBgStyle}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', border: `2.5px solid ${themePrimary}`, objectFit: 'cover', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--border-glass)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
              )}
              <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{name || 'Tu Nombre'}</h3>
              <p style={{ color: themeSecondary, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{jobTitle || 'Tu Profesión'}</p>
              {company && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{company}</p>}
            </div>
 
            {bio && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.4' }}>{bio}</p>}
 
            {/* Redes */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {linkedin && <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>LinkedIn</span>}
              {x && <span className="badge badge-business" style={{ fontSize: '0.65rem' }}>𝕏</span>}
              {instagram && <span className="badge badge-user" style={{ fontSize: '0.65rem' }}>Instagram</span>}
              {github && <span className="badge badge-user" style={{ fontSize: '0.65rem' }}>GitHub</span>}
            </div>
 
            {/* Mensajería */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {whatsapp && <div style={{ flex: 1, backgroundColor: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.75rem', textAlign: 'center', color: '#25D366' }}>WhatsApp</div>}
              {telegram && <div style={{ flex: 1, backgroundColor: 'rgba(0,136,204,0.15)', border: '1px solid rgba(0,136,204,0.3)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.75rem', textAlign: 'center', color: '#0088cc' }}>Telegram</div>}
            </div>
 
            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {buttons.map(b => (
                <div key={b.id} style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>
                  🔗 {b.label}
                </div>
              ))}
            </div>
          </div>
 
          {/* CÓDIGO QR DESCARGABLE */}
          <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '1rem' }}>🔳 Compartir con Código QR</h4>
            <div style={{ padding: '1rem', background: '#0b0f19', borderRadius: '16px', display: 'inline-block', border: '1px solid var(--border-glass)' }}>
              <img src={mockQRUrl} alt="QR Code" style={{ width: '180px', height: '180px', borderRadius: '8px' }} />
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', overflowWrap: 'break-word' }}>
              Enlace público:<br />
              <a href={`${window.location.origin}/card/${slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)' }}>{`/card/${slug}`}</a>
            </p>
 
            <a href={mockQRUrl} download={`qr_${slug}.png`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '1rem' }}>
              💾 Descargar Imagen QR
            </a>
          </div>
 
        </div>
 
      </div>

      {/* MODAL DE CÁMARA */}
      <CameraModal
        isOpen={isCamOpen}
        onClose={() => setIsCamOpen(false)}
        onCapture={camTarget === 'avatar' ? setAvatarUrl : setLogoUrl}
        title={camTarget === 'avatar' ? "Tomar Foto de Perfil" : "Tomar Foto del Logo"}
      />
    </div>
  );
};

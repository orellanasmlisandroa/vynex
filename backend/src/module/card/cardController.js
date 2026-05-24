const { query, inMemoryDB } = require('../../core/db');
const { logger } = require('../../process/metrics/metricsExporter');

/**
 * Obtener la tarjeta digital propia del usuario autenticado.
 */
async function getMyCard(req, res) {
  const userId = req.user.id;
  try {
    const result = await query('SELECT * FROM digital_cards WHERE user_id = $1', [userId]);
    const card = result.rows[0];
    
    res.json({
      success: true,
      card: card || null
    });
  } catch (err) {
    logger.error(`Error en getMyCard: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Crear o actualizar la tarjeta digital del usuario.
 */
async function createOrUpdateMyCard(req, res) {
  const userId = req.user.id;
  const {
    slug, name, job_title, company, bio, phone, email, address,
    avatar_url, logo_url, socials, messengers, marketplaces, buttons, theme
  } = req.body;

  if (!slug || !name) {
    return res.status(400).json({ success: false, message: 'slug y name son campos obligatorios.' });
  }

  try {
    // Verificar si la tarjeta ya existe para el usuario
    const checkRes = await query('SELECT * FROM digital_cards WHERE user_id = $1', [userId]);
    const existingCard = checkRes.rows[0];

    // Verificar unicidad del slug en otros usuarios
    const slugCheck = await query('SELECT * FROM digital_cards WHERE slug = $1 AND user_id != $2', [slug, userId]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El identificador de URL (slug) ya se encuentra en uso por otra tarjeta.' });
    }

    if (existingCard) {
      // Actualizar tarjeta existente
      await query(
        'UPDATE digital_cards SET slug = $1, name = $2, job_title = $3, company = $4, bio = $5, phone = $6, email = $7, address = $8, avatar_url = $9, logo_url = $10, socials = $11, messengers = $12, marketplaces = $13, buttons = $14, theme = $15 WHERE id = $16',
        [slug, name, job_title, company, bio, phone, email, address, avatar_url, logo_url, socials, messengers, marketplaces, buttons, theme, existingCard.id]
      );
      
      const updated = inMemoryDB.digital_cards.find(c => c.id === existingCard.id);

      res.json({
        success: true,
        message: 'Tarjeta digital actualizada exitosamente.',
        card: updated
      });
    } else {
      // Crear nueva tarjeta
      const insertRes = await query(
        'INSERT INTO digital_cards (user_id, slug, name, job_title, company, bio, phone, email, address, avatar_url, logo_url, socials, messengers, marketplaces, buttons, theme) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
        [userId, slug, name, job_title, company, bio, phone, email, address, avatar_url, logo_url, socials, messengers, marketplaces, buttons, theme]
      );

      res.status(201).json({
        success: true,
        message: 'Tarjeta digital creada exitosamente.',
        card: insertRes.rows[0]
      });
    }
  } catch (err) {
    logger.error(`Error en createOrUpdateMyCard: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Obtener tarjeta pública (libre de token) para escaneos de QR y compartir enlace.
 */
async function getPublicCard(req, res) {
  const { idOrSlug } = req.params;
  try {
    const result = await query('SELECT * FROM digital_cards WHERE slug = $1 OR id = $2', [idOrSlug, isNaN(idOrSlug) ? -1 : parseInt(idOrSlug)]);
    const card = result.rows[0];

    if (!card) {
      return res.status(404).json({ success: false, message: 'La tarjeta digital solicitada no existe.' });
    }

    // Registrar analítica de visita en segundo plano
    await query('INSERT INTO digital_card_analytics (card_id, event_type) VALUES ($1, $2)', [card.id, 'visit']);

    res.json({
      success: true,
      card
    });
  } catch (err) {
    logger.error(`Error en getPublicCard: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Descarga dinámica de archivo vCard (.vcf) profesional compatible con agendas móviles.
 */
async function downloadVCard(req, res) {
  const { idOrSlug } = req.params;
  try {
    const result = await query('SELECT * FROM digital_cards WHERE slug = $1 OR id = $2', [idOrSlug, isNaN(idOrSlug) ? -1 : parseInt(idOrSlug)]);
    const card = result.rows[0];

    if (!card) {
      return res.status(404).send('Tarjeta no encontrada');
    }

    // Formatear bloque vCard versión 3.0
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.name}`,
      `N:;${card.name};;;`,
      `ORG:${card.company || ''}`,
      `TITLE:${card.job_title || ''}`,
      `TEL;TYPE=CELL,VOICE:${card.phone || ''}`,
      `EMAIL;TYPE=PREF,INTERNET:${card.email || ''}`,
      `ADR;TYPE=WORK:;;${card.address || ''};;;`,
      `NOTE:${card.bio || ''}`,
      `URL:${card.socials?.linkedin || ''}`,
      'END:VCARD'
    ];

    const vCardContent = vCardLines.join('\r\n');

    // Registrar analítica de descarga
    await query('INSERT INTO digital_card_analytics (card_id, event_type, button_id) VALUES ($1, $2, $3)', [card.id, 'click_button', 'save_contact']);

    // Configurar cabeceras HTTP de descarga de archivo nativo
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug || 'contacto'}.vcf"`);
    res.send(vCardContent);
  } catch (err) {
    logger.error(`Error en downloadVCard: ${err.message}`);
    res.status(500).send('Error interno al compilar vCard');
  }
}

/**
 * Registrar envío de formulario de captación de leads público.
 */
async function submitLead(req, res) {
  const { idOrSlug } = req.params;
  const { name, email, phone, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y Correo electrónico son requeridos.' });
  }

  try {
    const result = await query('SELECT * FROM digital_cards WHERE slug = $1 OR id = $2', [idOrSlug, isNaN(idOrSlug) ? -1 : parseInt(idOrSlug)]);
    const card = result.rows[0];

    if (!card) {
      return res.status(404).json({ success: false, message: 'Tarjeta asociada no encontrada.' });
    }

    // Insertar prospecto en DB
    await query(
      'INSERT INTO digital_card_leads (card_id, name, email, phone, message) VALUES ($1, $2, $3, $4, $5)',
      [card.id, name, email, phone, message]
    );

    res.status(201).json({
      success: true,
      message: '¡Tus datos de contacto han sido enviados correctamente!'
    });
  } catch (err) {
    logger.error(`Error en submitLead: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Registrar eventos analíticos de clic por parte del visitante.
 */
async function registerClick(req, res) {
  const { idOrSlug } = req.params;
  const { eventType, itemId } = req.body; // eventType: 'click_button' o 'click_social', itemId: id de red social o botón

  try {
    const result = await query('SELECT * FROM digital_cards WHERE slug = $1 OR id = $2', [idOrSlug, isNaN(idOrSlug) ? -1 : parseInt(idOrSlug)]);
    const card = result.rows[0];

    if (!card) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada.' });
    }

    const buttonId = eventType === 'click_button' ? itemId : null;
    const socialId = eventType === 'click_social' ? itemId : null;

    await query(
      'INSERT INTO digital_card_analytics (card_id, event_type, button_id, social_id) VALUES ($1, $2, $3, $4)',
      [card.id, eventType, buttonId, socialId]
    );

    res.json({ success: true, message: 'Evento analítico registrado.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Obtener consolidado analítico de la tarjeta propia.
 */
async function getAnalytics(req, res) {
  const userId = req.user.id;
  try {
    const checkRes = await query('SELECT * FROM digital_cards WHERE user_id = $1', [userId]);
    const card = checkRes.rows[0];

    if (!card) {
      return res.json({ success: true, analytics: [], leads: [], hasCard: false });
    }

    // Consulta consolidada de analíticas y leads
    const analyticsRes = await query('SELECT * FROM digital_card_analytics WHERE card_id = $1', [card.id]);
    const leadsRes = await query('SELECT * FROM digital_card_leads WHERE card_id = $1 ORDER BY timestamp DESC', [card.id]);

    res.json({
      success: true,
      hasCard: true,
      card,
      analytics: analyticsRes.rows,
      leads: leadsRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Exportar Leads en formato CSV plano para administración externa.
 */
async function exportLeadsCSV(req, res) {
  const userId = req.user.id;
  try {
    const checkRes = await query('SELECT * FROM digital_cards WHERE user_id = $1', [userId]);
    const card = checkRes.rows[0];

    if (!card) {
      return res.status(400).send('No posees una tarjeta configurada para exportar prospectos.');
    }

    const leadsRes = await query('SELECT * FROM digital_card_leads WHERE card_id = $1 ORDER BY timestamp DESC', [card.id]);
    
    // Armar CSV en español con cabeceras correctas
    const headers = ['ID', 'Nombre Completo', 'Email', 'Telefono', 'Mensaje de Lead', 'Fecha de Envío'];
    const rows = leadsRes.rows.map(l => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.email,
      `"${l.phone || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      new Date(l.timestamp).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vynex_leads_${card.slug}.csv"`);
    res.send('\uFEFF' + csvContent); // Añadir BOM UTF-8
  } catch (err) {
    res.status(500).send('Error interno al exportar CSV.');
  }
}

/**
 * Exportar Clics y telemetrías en formato CSV.
 */
async function exportAnalyticsCSV(req, res) {
  const userId = req.user.id;
  try {
    const checkRes = await query('SELECT * FROM digital_cards WHERE user_id = $1', [userId]);
    const card = checkRes.rows[0];

    if (!card) {
      return res.status(400).send('Tarjeta no configurada.');
    }

    const analyticsRes = await query('SELECT * FROM digital_card_analytics WHERE card_id = $1', [card.id]);
    
    const headers = ['ID', 'Tipo de Evento', 'Boton Pulsado', 'Red Social', 'Clicks Acumulados', 'Ultimo Registro'];
    const rows = analyticsRes.rows.map(a => [
      a.id,
      a.event_type,
      a.button_id || 'N/A',
      a.social_id || 'N/A',
      a.count || 1,
      new Date(a.timestamp).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vynex_analytics_${card.slug}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).send('Error interno al exportar métricas.');
  }
}

/**
 * Emulador de Wallet. Genera y descarga el archivo base estructurado pass.json y emula las claves.
 */
async function getWalletPass(req, res) {
  const { idOrSlug } = req.params;
  try {
    const result = await query('SELECT * FROM digital_cards WHERE slug = $1 OR id = $2', [idOrSlug, isNaN(idOrSlug) ? -1 : parseInt(idOrSlug)]);
    const card = result.rows[0];

    if (!card) {
      return res.status(404).json({ success: false, message: 'Tarjeta no encontrada.' });
    }

    // Estructura oficial aproximada del pass.json de Apple Wallet
    const walletPassJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.vynex.digitalcard',
      serialNumber: `VYNEX-CARD-${card.id}-${card.slug}`,
      teamIdentifier: 'VYNEXTECH12',
      webServiceURL: 'https://api.vynex.com/wallet',
      authenticationToken: 'vynex_secure_auth_token_hash_2026',
      barcode: {
        message: `https://vynex.com/card/${card.slug}`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      },
      organizationName: 'VYNEX Tech Solutions',
      description: `Tarjeta Digital Profesional de ${card.name}`,
      logoText: 'VYNEX DIGITAL CARD',
      foregroundColor: '#ffffff',
      backgroundColor: card.theme?.bgColor || '#0b0f19',
      labelColor: '#06b6d4',
      generic: {
        primaryFields: [
          {
            key: 'name',
            label: 'Profesional',
            value: card.name
          }
        ],
        secondaryFields: [
          {
            key: 'title',
            label: 'Cargo / Profesión',
            value: card.job_title || ''
          },
          {
            key: 'company',
            label: 'Empresa',
            value: card.company || ''
          }
        ],
        auxiliaryFields: [
          {
            key: 'phone',
            label: 'Teléfono',
            value: card.phone || ''
          },
          {
            key: 'email',
            label: 'Correo Electrónico',
            value: card.email || ''
          }
        ],
        backFields: [
          {
            key: 'bio',
            label: 'Biografía del Profesional',
            value: card.bio || ''
          },
          {
            key: 'link',
            label: 'Enlace a Tarjeta Completa',
            value: `https://vynex.com/card/${card.slug}`
          }
        ]
      }
    };

    // Registrar analítica de exportación de Wallet
    await query('INSERT INTO digital_card_analytics (card_id, event_type, button_id) VALUES ($1, $2, $3)', [card.id, 'click_button', 'wallet_download']);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pass_${card.slug}.json"`);
    res.send(JSON.stringify(walletPassJson, null, 2));
  } catch (err) {
    logger.error(`Error en getWalletPass: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getMyCard,
  createOrUpdateMyCard,
  getPublicCard,
  downloadVCard,
  submitLead,
  registerClick,
  getAnalytics,
  exportLeadsCSV,
  exportAnalyticsCSV,
  getWalletPass
};

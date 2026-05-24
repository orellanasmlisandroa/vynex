const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const useFallback = process.env.DB_FALLBACK_IN_MEMORY === 'true';

// Configuración del Pool de PostgreSQL
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vynex_db',
  max: 10, // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let pool = null;

// Simulación de Base de Datos en Memoria (Fallback robusto)
const inMemoryDB = {
  users: [
    { id: 1, username: 'admin', email: 'admin@vynex.com', password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'ADMIN' }, // pw: password
    { id: 2, username: 'business_mgr', email: 'business@vynex.com', password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'BUSINESS' },
    { id: 3, username: 'user_dev', email: 'user@vynex.com', password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role: 'USER' }
  ],
  tasks: [
    { id: 1, title: 'Revisar logs de auditoría', completed: false, assigned_to: 3 },
    { id: 2, title: 'Analizar panel de métricas operacionales', completed: true, assigned_to: 2 }
  ],
  flows: [
    { id: 1, name: 'Sincronización de Repositorio', status: 'COMPLETED', triggered_by: 'ADMIN', timestamp: new Date() },
    { id: 2, name: 'Automatización de Tareas Stitch', status: 'IN_PROGRESS', triggered_by: 'BUSINESS', timestamp: new Date() }
  ],
  digital_cards: [
    {
      id: 1,
      user_id: 3, // Pertenece a 'user_dev'
      slug: 'lisandro-orellana',
      name: 'Lisandro Orellana',
      job_title: 'Ingeniero de Software Senior',
      company: 'VYNEX Tech Solutions',
      bio: 'Desarrollador full-stack apasionado por la creación de arquitecturas modulares, automatizaciones y experiencias premium en la web.',
      phone: '+503 7777-1234',
      email: 'user@vynex.com',
      address: 'San Salvador, El Salvador',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250&h=250',
      logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150',
      socials: {
        linkedin: 'https://linkedin.com/in/orellanasmlisandroa',
        x: 'https://x.com/vynex',
        instagram: 'https://instagram.com/vynex',
        github: 'https://github.com/orellanasmlisandroa/vynex'
      },
      messengers: {
        whatsapp: 'https://wa.me/50377771234',
        telegram: 'https://t.me/lisandro_vynex'
      },
      marketplaces: {
        shopify: 'https://shopify.com/vynex-store',
        amazon: 'https://amazon.com/shop/vynex'
      },
      buttons: [
        { id: 'b1', label: 'Mi Portafolio Profesional', url: 'https://vynex.com/portfolio', icon: 'link' },
        { id: 'b2', label: 'Reserva una Reunión (Calendly)', url: 'https://calendly.com/vynex/15min', icon: 'calendar' }
      ],
      theme: {
        mode: 'dark',
        bgColor: '#0b0f19',
        cardBg: 'rgba(17, 25, 40, 0.65)',
        primaryColor: '#7c3aed',
        secondaryColor: '#06b6d4',
        accentColor: '#db2777',
        fontFamily: 'Outfit'
      }
    }
  ],
  digital_card_analytics: [
    { id: 1, card_id: 1, event_type: 'visit', count: 124, timestamp: new Date() },
    { id: 2, card_id: 1, event_type: 'qr_scan', count: 48, timestamp: new Date() },
    { id: 3, card_id: 1, event_type: 'click_button', button_id: 'b1', count: 32, timestamp: new Date() },
    { id: 4, card_id: 1, event_type: 'click_social', social_id: 'linkedin', count: 21, timestamp: new Date() }
  ],
  digital_card_leads: [
    { id: 1, card_id: 1, name: 'Sofía Martínez', email: 'sofia@empresa.com', phone: '+503 7777-8888', message: 'Me interesa cotizar un desarrollo similar para mi negocio.', timestamp: new Date() }
  ]
};

// Inicialización segura del Pool
try {
  if (!useFallback) {
    pool = new Pool(poolConfig);
    // Verificar conexión básica
    pool.on('error', (err) => {
      console.warn('⚠️ Error en el Pool de PostgreSQL:', err.message);
    });
  }
} catch (e) {
  console.warn('⚠️ No se pudo inicializar el cliente nativo de PostgreSQL. Usando base de datos en memoria.');
}

/**
 * Ejecutor de Queries centralizado que decide dinámicamente si usar PostgreSQL real
 * o la emulación en memoria.
 */
async function query(text, params) {
  // Si estamos en modo PostgreSQL real y el pool está activo
  if (pool) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.warn('⚠️ Error de conexión a PostgreSQL. Cambiando temporalmente a base de datos en memoria de respaldo. Detalle:', error.message);
    }
  }

  // Lógica del Fallback en memoria (Simula estructura PostgreSQL)
  console.log(`[DB Mock] Consultando query simulada: "${text}" con parámetros: [${params || ''}]`);
  
  const lowerText = text.toLowerCase();
  
  // 1. Simulación de Autenticación / Registro y Búsqueda de Usuarios
  if (lowerText.includes('select * from users') || lowerText.includes('select id, username')) {
    if (params && params.length > 0) {
      const searchValue = params[0];
      const user = inMemoryDB.users.find(u => u.email === searchValue || u.username === searchValue);
      return { rows: user ? [user] : [] };
    }
    return { rows: inMemoryDB.users };
  }

  if (lowerText.includes('insert into users')) {
    const newUser = {
      id: inMemoryDB.users.length + 1,
      username: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3] || 'USER'
    };
    inMemoryDB.users.push(newUser);
    return { rows: [newUser] };
  }

  // 2. Simulación de Tareas (Para Módulos de Usuario y Business)
  if (lowerText.includes('select * from tasks')) {
    return { rows: inMemoryDB.tasks };
  }

  if (lowerText.includes('insert into tasks')) {
    const newTask = {
      id: inMemoryDB.tasks.length + 1,
      title: params[0],
      completed: false,
      assigned_to: params[1]
    };
    inMemoryDB.tasks.push(newTask);
    return { rows: [newTask] };
  }

  if (lowerText.includes('update tasks set completed')) {
    const id = params[1];
    const completed = params[0];
    const task = inMemoryDB.tasks.find(t => t.id === id);
    if (task) task.completed = completed;
    return { rows: task ? [task] : [] };
  }

  // 3. Simulación de Flujos (Flows)
  if (lowerText.includes('select * from flows')) {
    return { rows: inMemoryDB.flows };
  }

  if (lowerText.includes('insert into flows')) {
    const newFlow = {
      id: inMemoryDB.flows.length + 1,
      name: params[0],
      status: params[1] || 'PENDING',
      triggered_by: params[2] || 'SYSTEM',
      timestamp: new Date()
    };
    inMemoryDB.flows.push(newFlow);
    return { rows: [newFlow] };
  }

  // 4. Simulación de Tarjetas Digitales (digital_cards)
  if (lowerText.includes('select * from digital_cards')) {
    // Buscar por user_id
    if (lowerText.includes('where user_id =')) {
      const userId = params[0];
      const card = inMemoryDB.digital_cards.find(c => c.user_id === parseInt(userId));
      return { rows: card ? [card] : [] };
    }
    // Buscar por slug o id
    if (lowerText.includes('where slug =') || lowerText.includes('id =')) {
      const searchVal = params[0]; // Puede ser slug o ID
      const card = inMemoryDB.digital_cards.find(c => c.slug === searchVal || c.id === parseInt(searchVal));
      return { rows: card ? [card] : [] };
    }
    return { rows: inMemoryDB.digital_cards };
  }

  if (lowerText.includes('insert into digital_cards')) {
    const newCard = {
      id: inMemoryDB.digital_cards.length + 1,
      user_id: params[0],
      slug: params[1],
      name: params[2],
      job_title: params[3],
      company: params[4],
      bio: params[5],
      phone: params[6],
      email: params[7],
      address: params[8],
      avatar_url: params[9],
      logo_url: params[10],
      socials: params[11] || {},
      messengers: params[12] || {},
      marketplaces: params[13] || {},
      buttons: params[14] || [],
      theme: params[15] || {}
    };
    inMemoryDB.digital_cards.push(newCard);
    return { rows: [newCard] };
  }

  if (lowerText.includes('update digital_cards set')) {
    const slug = params[0];
    const name = params[1];
    const jobTitle = params[2];
    const company = params[3];
    const bio = params[4];
    const phone = params[5];
    const email = params[6];
    const address = params[7];
    const avatarUrl = params[8];
    const logoUrl = params[9];
    const socials = params[10];
    const messengers = params[11];
    const marketplaces = params[12];
    const buttons = params[13];
    const theme = params[14];
    const cardId = params[15];

    const card = inMemoryDB.digital_cards.find(c => c.id === parseInt(cardId));
    if (card) {
      card.slug = slug;
      card.name = name;
      card.job_title = jobTitle;
      card.company = company;
      card.bio = bio;
      card.phone = phone;
      card.email = email;
      card.address = address;
      card.avatar_url = avatarUrl;
      card.logo_url = logoUrl;
      card.socials = socials;
      card.messengers = messengers;
      card.marketplaces = marketplaces;
      card.buttons = buttons;
      card.theme = theme;
    }
    return { rows: card ? [card] : [] };
  }

  // 5. Simulación de Prospectos (digital_card_leads)
  if (lowerText.includes('select * from digital_card_leads')) {
    if (lowerText.includes('where card_id =')) {
      const cardId = params[0];
      const leads = inMemoryDB.digital_card_leads.filter(l => l.card_id === parseInt(cardId));
      return { rows: leads };
    }
    return { rows: inMemoryDB.digital_card_leads };
  }

  if (lowerText.includes('insert into digital_card_leads')) {
    const newLead = {
      id: inMemoryDB.digital_card_leads.length + 1,
      card_id: params[0],
      name: params[1],
      email: params[2],
      phone: params[3],
      message: params[4],
      timestamp: new Date()
    };
    inMemoryDB.digital_card_leads.push(newLead);
    return { rows: [newLead] };
  }

  // 6. Simulación de Analíticas (digital_card_analytics)
  if (lowerText.includes('select * from digital_card_analytics')) {
    if (lowerText.includes('where card_id =')) {
      const cardId = params[0];
      const analytics = inMemoryDB.digital_card_analytics.filter(a => a.card_id === parseInt(cardId));
      return { rows: analytics };
    }
    return { rows: inMemoryDB.digital_card_analytics };
  }

  if (lowerText.includes('insert into digital_card_analytics') || lowerText.includes('update digital_card_analytics')) {
    // Si estamos registrando o incrementando clics/visitas
    const cardId = params[0];
    const eventType = params[1];
    const buttonId = params[2] || null;
    const socialId = params[3] || null;

    // Buscar si ya existe el registro analítico para este evento
    let record = inMemoryDB.digital_card_analytics.find(a => 
      a.card_id === parseInt(cardId) && 
      a.event_type === eventType && 
      (buttonId ? a.button_id === buttonId : true) &&
      (socialId ? a.social_id === socialId : true)
    );

    if (record) {
      record.count += 1;
      record.timestamp = new Date();
    } else {
      record = {
        id: inMemoryDB.digital_card_analytics.length + 1,
        card_id: parseInt(cardId),
        event_type: eventType,
        button_id: buttonId,
        social_id: socialId,
        count: 1,
        timestamp: new Date()
      };
      inMemoryDB.digital_card_analytics.push(record);
    }
    return { rows: [record] };
  }

  return { rows: [] };
}

module.exports = {
  query,
  pool,
  inMemoryDB
};

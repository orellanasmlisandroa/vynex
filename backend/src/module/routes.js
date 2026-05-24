const express = require('express');
const router = express.Router();

const { verifyToken, hashPassword, comparePassword, generateAccessToken, generateRefreshToken } = require('../core/auth/auth');
const { requireRole } = require('../process/roles/roleMiddleware');
const { query, inMemoryDB } = require('../core/db');
const { getOperationalMetrics, triggerStitchFlow } = require('./business/businessController');
const { getTasks, updateTaskStatus } = require('./user/userController');
const { listUsers, updateUserRole } = require('./admin/adminController');
const { getMyCard, createOrUpdateMyCard, getPublicCard, downloadVCard, submitLead, registerClick, getAnalytics, exportLeadsCSV, exportAnalyticsCSV, getWalletPass } = require('./card/cardController');
const { redirectToGoogle, handleGoogleCallback } = require('../core/auth/googleAuth');

/**
 * ==========================================
 * 1. ENRUTADOR DE AUTENTICACIÓN (/auth)
 * ==========================================
 */

// Rutas de autenticación con Google
router.get('/auth/google', redirectToGoogle);
router.get('/auth/google/callback', handleGoogleCallback);

// Registro de nuevos usuarios
router.post('/auth/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'username, email y password son campos requeridos.' });
  }

  try {
    // Verificar si el usuario ya existe
    const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya se encuentra registrado.' });
    }

    const hashed = await hashPassword(password);
    const assignedRole = role || 'USER'; // Rol por defecto

    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashed, assignedRole]
    );

    const newUser = result.rows[0];
    const token = generateAccessToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente en la plataforma VYNEX.',
      token,
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inicio de sesión (Login)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Parámetros email y password obligatorios.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: `Bienvenido de nuevo a VYNEX, ${user.username}!`,
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ==========================================
 * 2. ENDPOINT DE ROLES Y PERMISOS (/roles)
 * ==========================================
 */
router.get('/roles', verifyToken, (req, res) => {
  const { ROLES, PERMISSIONS } = require('../../../shared/constants');
  
  // Retorna el rol del usuario actual y su lista completa de permisos
  const userRole = req.user.role;
  const userPermissions = PERMISSIONS[userRole] || [];

  res.json({
    success: true,
    role: userRole,
    permissions: userPermissions,
    availableRoles: Object.values(ROLES),
    matrix: PERMISSIONS
  });
});

/**
 * ==========================================
 * 3. ENRUTADOR DE FLUJOS AUTOMATIZADOS (/flows)
 * ==========================================
 */

// Listar flujos ejecutados
router.get('/flows', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM flows ORDER BY timestamp DESC');
    res.json({
      success: true,
      flows: result.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disparar nuevo flujo de automatización (Requiere BUSINESS o ADMIN)
router.post('/flows', verifyToken, requireRole('BUSINESS'), triggerStitchFlow);

/**
 * ==========================================
 * 4. ENDPOINT DE MÉTRICAS (/metrics)
 * ==========================================
 */
router.get('/metrics', verifyToken, requireRole('BUSINESS'), getOperationalMetrics);

/**
 * ==========================================
 * 5. RUTAS ADICIONALES (ADMIN & USER MODULES)
 * ==========================================
 */

// Tareas asignadas al usuario actual
router.get('/user/tasks', verifyToken, getTasks);
router.post('/user/tasks/status', verifyToken, updateTaskStatus);

// Panel de administración de usuarios (ADMIN ONLY)
router.get('/admin/users', verifyToken, requireRole('ADMIN'), listUsers);
router.post('/admin/users/role', verifyToken, requireRole('ADMIN'), updateUserRole);

/**
 * ==========================================
 * 6. ENRUTADOR VYNEX DIGITAL CARD (/card)
 * ==========================================
 */

// Rutas Privadas (Requieren verificación de token JWT)
router.get('/card/my', verifyToken, getMyCard);
router.post('/card/my', verifyToken, createOrUpdateMyCard);
router.get('/card/analytics', verifyToken, getAnalytics);
router.get('/card/export/leads', verifyToken, exportLeadsCSV);
router.get('/card/export/analytics', verifyToken, exportAnalyticsCSV);

// Rutas Públicas (Sin token para escaneos de QR y accesos remotos)
router.get('/card/public/:idOrSlug', getPublicCard);
router.get('/card/public/:idOrSlug/vcard', downloadVCard);
router.post('/card/public/:idOrSlug/lead', submitLead);
router.post('/card/public/:idOrSlug/click', registerClick);
router.get('/card/public/:idOrSlug/wallet', getWalletPass);

module.exports = router;

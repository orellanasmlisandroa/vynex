const { query } = require('../db');
const { generateAccessToken, generateRefreshToken } = require('./auth');

// Helper to make API requests using global fetch (standard in Node 18+)
async function makeRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`makeRequest failed for ${url}:`, err);
    throw err;
  }
}

function redirectToGoogle(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';
  
  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'GOOGLE_CLIENT_ID no está configurado en el servidor.'
    });
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ')
  };

  const qs = new URLSearchParams(options).toString();
  const authUrl = `${rootUrl}?${qs}`;
  
  res.redirect(authUrl);
}

async function handleGoogleCallback(req, res) {
  const code = req.query.code;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
  
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';

  try {
    // 1. Exchange authorization code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString();

    const tokenResponse = await makeRequest(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams
    });

    const { access_token } = tokenResponse;

    if (!access_token) {
      console.error('Google token exchange error, response:', tokenResponse);
      return res.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }

    // 2. Fetch user profile from Google
    const userinfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`;
    const googleUser = await makeRequest(userinfoUrl);

    if (!googleUser || !googleUser.email) {
      console.error('Google userinfo error:', googleUser);
      return res.redirect(`${frontendUrl}/login?error=user_info_failed`);
    }

    const { email, name } = googleUser;
    
    // 3. Find or create user in VYNEX Database
    let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      // Create new user since it doesn't exist
      const username = email.split('@')[0] || name || 'vynex_user';
      // Mock password hash for OAuth accounts
      const mockPasswordHash = '$2a$10$OAuthAccountsHaveNoPasswordHashThisIsJustPlaceholder';
      
      const insertResult = await query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, email, mockPasswordHash, 'USER']
      );
      user = insertResult.rows[0];
    }

    // 4. Generate VYNEX Tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }));

    // 5. Redirect back to Frontend
    res.redirect(`${frontendUrl}/login?token=${token}&refreshToken=${refreshToken}&user=${userPayload}`);

  } catch (err) {
    console.error('Google OAuth Error:', err);
    res.redirect(`${frontendUrl}/login?error=oauth_exception`);
  }
}

module.exports = {
  redirectToGoogle,
  handleGoogleCallback
};

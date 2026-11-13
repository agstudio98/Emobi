import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { database, saveDatabase, getSessionSecret } from '../services/store.js';
import { config } from '../config/aiConfig.js';

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const usernamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{1,18}[A-Za-z0-9]$/;

const publicUser = ({ id, username, email, name, provider, createdAt }) => ({ id, username, email, name, provider, createdAt });

const issueSession = (user) => {
  const now = Math.floor(Date.now() / 1000);
  Object.entries(database.sessions).forEach(([id, session]) => {
    if (session.expiresAt <= now) delete database.sessions[id];
  });
  const sessionId = randomBytes(24).toString('hex');
  database.sessions[sessionId] = { userId: user.id, expiresAt: now + SESSION_LIFETIME_SECONDS };
  saveDatabase();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, sid: sessionId, iat: now, exp: now + SESSION_LIFETIME_SECONDS })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const signature = createHmac('sha256', getSessionSecret()).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
};

export const verifySession = (token) => {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const unsigned = `${header}.${payload}`;
    const expected = createHmac('sha256', getSessionSecret()).update(unsigned).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || !claims.sid || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    const session = database.sessions[claims.sid];
    if (!session || session.userId !== claims.sub || session.expiresAt <= Date.now() / 1000) return null;
    return database.users.find(user => user.id === claims.sub) || null;
  } catch (err) {
    return null;
  }
};

export const register = async (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!usernamePattern.test(username)) {
    return res.status(400).json({ error: 'El usuario debe tener entre 3 y 20 caracteres, comenzar y terminar con una letra o número, y solo puede incluir letras sin acentos, números, punto, guion o guion bajo.' });
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (password.length < 12 || password.length > 128 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || /\s/.test(password)) {
    return res.status(400).json({ error: 'La contraseña requiere 12 a 128 caracteres, una mayúscula, una minúscula, un número y un símbolo, sin espacios.' });
  }
  if (database.users.some(user => user.email === email || user.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Ese correo o nombre de usuario ya está registrado.' });
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = (await scrypt(password, salt, 64)).toString('hex');
  if (database.users.some(user => user.email === email || user.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Ese correo o nombre de usuario ya está registrado.' });
  }
  const user = {
    id: `user-${randomBytes(16).toString('hex')}`,
    username,
    email,
    name: username,
    provider: 'password',
    passwordSalt: salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  database.users.push(user);
  database.companions[user.id] = [];
  saveDatabase();
  res.status(201).json({ token: issueSession(user), user: publicUser(user) });
};

export const login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (password.length > 128) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  const user = database.users.find(item => item.email === email);
  if (!user?.passwordHash || !user?.passwordSalt) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const candidate = (await scrypt(password, user.passwordSalt, 64));
  const expected = Buffer.from(user.passwordHash, 'hex');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  res.json({ token: issueSession(user), user: publicUser(user) });
};

const uniqueUsername = (email) => {
  let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').slice(0, 15) || 'emobi';
  if (base.length < 3) base = `${base}user`.slice(0, 15);
  let username = base;
  let suffix = 1;
  while (database.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    username = `${base.slice(0, 15)}${suffix++}`;
  }
  return username;
};

export const googleLogin = async (req, res) => {
  if (!config.googleClientId) {
    return res.status(503).json({ error: 'El inicio de sesión con Google todavía no está configurado en el servidor.' });
  }
  const credential = String(req.body.credential || '');
  if (!credential || credential.length > 10000) {
    return res.status(400).json({ error: 'No se recibió una credencial válida de Google.' });
  }

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const claims = await response.json();
    if (!response.ok || claims.aud !== config.googleClientId || claims.email_verified !== 'true' || !claims.email) {
      return res.status(401).json({ error: 'No se pudo verificar la cuenta de Google.' });
    }

    const email = String(claims.email).toLowerCase();
    let user = database.users.find(item => item.email === email);
    if (!user) {
      user = {
        id: `user-${randomBytes(16).toString('hex')}`,
        username: uniqueUsername(email),
        email,
        name: String(claims.name || claims.given_name || email.split('@')[0]).slice(0, 80),
        provider: 'google',
        googleSubject: claims.sub,
        createdAt: new Date().toISOString(),
      };
      database.users.push(user);
      database.companions[user.id] = [];
    } else if (!user.googleSubject) {
      user.googleSubject = claims.sub;
      saveDatabase();
    }
    saveDatabase();
    res.json({ token: issueSession(user), user: publicUser(user) });
  } catch (err) {
    console.error('Error verificando sesión de Google:', err);
    res.status(502).json({ error: 'No se pudo conectar con Google. Inténtalo nuevamente.' });
  }
};

export const currentUser = (req, res) => res.json({ user: publicUser(req.user) });

export const logout = (req, res) => {
  delete database.sessions[req.sessionId];
  saveDatabase();
  res.json({ success: true });
};

import { verifySession } from '../controllers/authController.js';

export const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const user = match ? verifySession(match[1]) : null;
  if (!user) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  req.user = user;
  req.sessionId = JSON.parse(Buffer.from(match[1].split('.')[1], 'base64url').toString('utf8')).sid;
  next();
};

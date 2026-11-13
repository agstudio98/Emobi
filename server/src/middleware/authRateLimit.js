const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const attemptsByAddress = new Map();

export const authRateLimit = (req, res, next) => {
  const now = Date.now();
  const address = req.socket.remoteAddress || 'unknown';
  const recent = (attemptsByAddress.get(address) || []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)));
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.' });
  }
  recent.push(now);
  attemptsByAddress.set(address, recent);
  if (attemptsByAddress.size > 10000) {
    for (const [key, timestamps] of attemptsByAddress) {
      if (!timestamps.length || now - timestamps[timestamps.length - 1] >= WINDOW_MS) attemptsByAddress.delete(key);
    }
  }
  next();
};

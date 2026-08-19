import { verifyToken } from '../routes/auth.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication session required.' });
  }

  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Invalid or expired authentication session. Please log in again.' });
  }

  req.user = verified;
  next();
}

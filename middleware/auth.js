const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log(`[Auth Middleware] ${req.method} ${req.originalUrl}`);
  console.log('[Auth Middleware] Headers:', JSON.stringify(req.headers, null, 2));

  const authHeader = req.headers.authorization || req.headers.Authorization || req.get('Authorization');
  console.log('[Auth Middleware] Authorization header:', authHeader);

  if (!authHeader) {
    console.log('[Auth Middleware] No authorization header provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    console.log('[Auth Middleware] Invalid authorization header format');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = tokenMatch[1].trim();
  console.log('[Auth Middleware] Extracted token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[Auth Middleware] Decoded:', decoded);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
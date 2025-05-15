module.exports = (req, res, next) => {
  console.log('[Admin Middleware] Checking user:', req.user);

  // Check if req.user exists and has role 'admin'
  if (!req.user || !req.user.role) {
    console.log('[Admin Middleware] No user or role found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  if (req.user.role !== 'admin') {
    console.log('[Admin Middleware] User is not admin, role:', req.user.role);
    return res.status(403).json({ message: 'Access denied, admin only' });
  }

  console.log('[Admin Middleware] Admin access granted for user:', req.user.id);
  next();
};
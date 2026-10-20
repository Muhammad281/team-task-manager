function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Please log in first' });
}

module.exports = { requireAuth };
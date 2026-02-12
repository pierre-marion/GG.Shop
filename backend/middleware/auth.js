const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    req.user = { role: 'visiteur' }; // Pas de token = visiteur
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { role: 'visiteur' }; // Token invalide = visiteur
      return next();
    }
    req.user = user; // Token valide = utilisateur connecté avec son rôle
    next();
  });
};

// Middleware pour vérifier les rôles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: `Cette action nécessite l'un des rôles suivants: ${allowedRoles.join(', ')}`,
        currentRole: req.user?.role || 'visiteur'
      });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };

// middleware/auth.js
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = process.env;

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

exports.checkRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user?.roles) {
      return res.status(403).json({ error: 'No roles assigned' });
    }

    const hasRequiredRole = requiredRoles.some(role => 
      req.user.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles,
        userRoles: req.user.roles
      });
    }

    next();
  };
};
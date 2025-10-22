const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ err: 'Authorization header missing.' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ err: 'Unauthorized.' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ err: 'Invalid token.' });
    req.user = payload;
    next();
  });
}

function authorizeRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ err: 'Unauthorized.' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ err: 'Forbidden.' });
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };

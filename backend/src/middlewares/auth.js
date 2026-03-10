/**
 * Middleware JWT — vérifie le token et attache req.user
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../config/database');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    prisma.user
      .findUnique({ where: { id: decoded.sub } })
      .then((user) => {
        if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
        };
        next();
      })
      .catch((err) => next(err));
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = { auth };

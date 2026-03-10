/**
 * Configuration centralisée — Time Manager
 * En production, JWT_SECRET est obligatoire (pas de fallback).
 */
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;
if (nodeEnv === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET est requis en production');
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  jwt: {
    secret: jwtSecret || 'dev_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
  /** Heure fixe (9h00) pour calcul du taux de retard */
  expectedClockInHour: 9,
  expectedClockInMinute: 0,
};

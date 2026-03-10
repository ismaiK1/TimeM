/**
 * Application Express — Time Manager
 */
const express = require('express');
const routes = require('./routes');
const { security } = require('./middlewares/security');
const logger = require('./utils/logger');

const app = express();
security(app);
app.use(express.json());
app.get('/health', (req, res) => res.json({ ok: true, service: 'timemanager-backend' }));
app.use('/', routes);

// Gestion d'erreurs globale
app.use((err, req, res, _next) => {
  logger.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;

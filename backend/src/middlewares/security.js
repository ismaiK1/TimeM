/**
 * Sécurité : Helmet + CORS stricts (XSS, origines)
 */
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

function security(app) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );
  app.use(
    cors({
      origin: config.frontendOrigin,
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
}

module.exports = { security };

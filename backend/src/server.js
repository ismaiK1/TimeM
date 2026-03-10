/**
 * Point d'entrée serveur — Time Manager
 */
const fs = require('fs');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

try {
  fs.mkdirSync('/app/logs', { recursive: true });
} catch (_) {
  // Ignorer si le répertoire n'est pas monté (ex. lancement local)
}

const port = config.port;
app.listen(port, '0.0.0.0', () => {
  logger.info(`Backend Time Manager listening on port ${port}`);
});

/**
 * Logger minimal — écrit sur stdout et dans /app/logs/app.log si le répertoire existe.
 * Permet la persistance des logs dans le volume Docker backend_logs.
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = '/app/logs';
const LOG_FILE = path.join(LOG_DIR, 'app.log');

let fileStream = null;
try {
  if (fs.existsSync(LOG_DIR) || process.env.FORCE_LOG_DIR === '1') {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fileStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  }
} catch (_) {
  // Répertoire indisponible (ex. lancement local sans volume)
}

function write(level, ...args) {
  const line = `[${new Date().toISOString()}] [${level}] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}\n`;
  process.stdout.write(line);
  if (fileStream && fileStream.writable) {
    fileStream.write(line);
  }
}

module.exports = {
  info: (...args) => write('INFO', ...args),
  error: (...args) => write('ERROR', ...args),
};

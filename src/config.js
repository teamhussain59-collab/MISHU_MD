import 'dotenv/config';

const ownerNumber = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');
const bool = (value, fallback = false) => value == null ? fallback : value.toLowerCase() === 'true';

export const config = Object.freeze({
  ownerJid: ownerNumber ? `${ownerNumber}@s.whatsapp.net` : '',
  prefix: process.env.BOT_PREFIX || '.',
  sessionDir: process.env.SESSION_DIR || 'auth_info',
  logLevel: process.env.LOG_LEVEL || 'warn',
  autoStatusSeen: bool(process.env.AUTO_STATUS_SEEN, false),
  autoReact: bool(process.env.AUTO_REACT, false),
  autoReactEmoji: process.env.AUTO_REACT_EMOJI || '✨',
  commandCooldownMs: Math.max(1000, Number(process.env.COMMAND_COOLDOWN_MS) || 3000),
});

if (!ownerNumber) {
  throw new Error('OWNER_NUMBER is required. Set it in your local .env file.');
}

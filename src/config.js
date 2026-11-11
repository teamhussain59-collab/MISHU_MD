import 'dotenv/config';

const ownerNumber = (process.env.OWNER_NUMBER || '').replace(/\D/g, '');

export const config = Object.freeze({
  ownerJid: ownerNumber ? `${ownerNumber}@s.whatsapp.net` : '',
  prefix: process.env.BOT_PREFIX || '.',
  sessionDir: process.env.SESSION_DIR || 'auth_info',
  logLevel: process.env.LOG_LEVEL || 'warn',
});

if (!ownerNumber) {
  throw new Error('OWNER_NUMBER is required. Set it in your local .env file.');
}

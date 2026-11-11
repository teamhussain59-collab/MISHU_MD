import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './src/config.js';
import { handleCommand } from './src/commands.js';

const logger = pino({ level: config.logLevel });
let reconnectTimer = null;
let shuttingDown = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      logger.info('★彡 MISHU MD 彡★ connected');
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (connection === 'close' && !shuttingDown && !reconnectTimer) {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('WhatsApp session logged out. Pair again using the account owner’s own device.');
        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startBot().catch((error) => logger.error({ err: error }, 'Reconnect failed'));
      }, 5000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue;
      const sender = message.key.participant || message.key.remoteJid;
      if (sender !== config.ownerJid) continue;

      const body = message.message.conversation
        || message.message.extendedTextMessage?.text
        || message.message.imageMessage?.caption
        || message.message.videoMessage?.caption
        || '';

      const parsed = body.startsWith(config.prefix)
        ? body.slice(config.prefix.length).trim().split(/\\s+/)
        : [];
      const [command = '', ...args] = parsed;
      if (!command) continue;

      try {
        await handleCommand(sock, message, command.toLowerCase(), args);
      } catch (error) {
        logger.error({ err: error }, 'Command execution failed');
        await sock.sendMessage(message.key.remoteJid, {
          text: 'Command failed. Please try again later.',
        }, { quoted: message });
      }
    }
  });

  return sock;
}

process.once('SIGINT', () => { shuttingDown = true; logger.info('Shutdown requested'); process.exit(0); });
process.once('SIGTERM', () => { shuttingDown = true; logger.info('Shutdown requested'); process.exit(0); });

startBot().catch((error) => {
  logger.error({ err: error }, 'MISHU MD startup failed');
  process.exitCode = 1;
});

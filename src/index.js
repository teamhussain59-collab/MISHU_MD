import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './config.js';
import { handleCommand } from './commands.js';

const logger = pino({ level: config.logLevel });
let reconnecting = false;

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
  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      logger.info('MISHU MD connected.');
      reconnecting = false;
    }
    if (connection === 'close' && !reconnecting) {
      reconnecting = true;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('Session logged out. Remove the local session only after confirming account ownership, then pair again.');
        return;
      }
      setTimeout(() => startBot().catch((error) => logger.error({ err: error }, 'Reconnect failed')), 5000);
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
      if (!body.startsWith(config.prefix)) continue;
      const [rawCommand, ...args] = body.slice(config.prefix.length).trim().split(/\s+/);
      if (!rawCommand) continue;
      try {
        await handleCommand(sock, message, rawCommand.toLowerCase(), args);
      } catch (error) {
        logger.error({ err: error }, 'Command failed');
        await sock.sendMessage(message.key.remoteJid, { text: 'Command failed. Please try again.' }, { quoted: message });
      }
    }
  });

  return sock;
}

startBot().catch((error) => {
  logger.error({ err: error }, 'Startup failed');
  process.exitCode = 1;
});

import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './src/config.js';
import { handleCommand } from './src/commands.js';

const logger = pino({ level: config.logLevel });
let reconnectTimer = null;
let shuttingDown = false;
const lastCommandAt = new Map();

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
      logger.info('★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★ by PROFACHNEL connected');
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (connection === 'close' && !shuttingDown && !reconnectTimer) {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('WhatsApp session logged out. Pair again from the account owner’s own device.');
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
      if (!message.message) continue;
      const jid = message.key.remoteJid || '';

      // Optional status-view automation; disabled unless explicitly enabled.
      if (config.autoStatusSeen && jid === 'status@broadcast') {
        try { await sock.readMessages([message.key]); }
        catch (error) { logger.warn({ err: error }, 'Could not mark status as seen'); }
        continue;
      }

      if (jid === 'status@broadcast' || message.key.fromMe) continue;

      // Optional lightweight reaction; disabled by default.
      if (config.autoReact && !jid.endsWith('@broadcast')) {
        try {
          await sock.sendMessage(jid, { react: { text: config.autoReactEmoji, key: message.key } });
        } catch (error) {
          logger.debug({ err: error }, 'Auto-reaction skipped');
        }
      }

      const sender = message.key.participant || jid;
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

      const now = Date.now();
      const previous = lastCommandAt.get(sender) || 0;
      if (now - previous < config.commandCooldownMs) {
        logger.warn('Owner command ignored by cooldown protection');
        continue;
      }
      lastCommandAt.set(sender, now);

      try {
        await handleCommand(sock, message, command.toLowerCase(), args);
      } catch (error) {
        logger.error({ err: error }, 'Command execution failed');
        await sock.sendMessage(jid, {
          text: 'Command failed. Please try again later.',
        }, { quoted: message });
      }
    }
  });

  return sock;
}

function shutdown() {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  logger.info('MISHU MD shutdown requested');
  process.exit(0);
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startBot().catch((error) => {
  logger.error({ err: error }, 'MISHU MD startup failed');
  process.exitCode = 1;
});

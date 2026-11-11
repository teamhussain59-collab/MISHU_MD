import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config } from './src/config.js';
import { handleCommand } from './src/commands.js';

const logger = pino({ level: config.logLevel });

// GitHub Actions smoke test: validate app startup without opening WhatsApp or
// generating a pairing code. Never expose account credentials in workflow logs.
if (config.smokeTest) {
  logger.info('MISHU MD smoke test passed: configuration loaded; WhatsApp connection intentionally skipped.');
  process.exit(0);
}

let reconnectTimer = null;
let shuttingDown = false;
let pairingRequested = false;
const lastCommandAt = new Map();

async function getPairingNumber() {
  if (config.pairingNumber) return config.pairingNumber;
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Set PAIRING_NUMBER in your private environment, or run the bot in an interactive terminal.');
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question('Enter your WhatsApp number with country code (digits only): ')).replace(/\D/g, '');
  } finally {
    rl.close();
  }
}

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

  sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const number = await getPairingNumber();
        if (!/^\d{8,15}$/.test(number)) {
          throw new Error('Invalid phone number. Use 8–15 digits including country code.');
        }
        const code = await sock.requestPairingCode(number);
        logger.info('Pairing code generated. Enter it in WhatsApp > Linked devices > Link with phone number.');
        console.log('★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★ pairing code:', code);
        console.log('Do not share this code with anyone.');
      } catch (error) {
        pairingRequested = false;
        logger.error({ err: error }, 'Could not generate pairing code');
      }
    }

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
        pairingRequested = false;
        startBot().catch((error) => logger.error({ err: error }, 'Reconnect failed'));
      }, 5000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      if (!message.message) continue;
      const jid = message.key.remoteJid || '';

      if (config.autoStatusSeen && jid === 'status@broadcast') {
        try { await sock.readMessages([message.key]); }
        catch (error) { logger.warn({ err: error }, 'Could not mark status as seen'); }
        continue;
      }

      if (jid === 'status@broadcast' || message.key.fromMe) continue;

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
        ? body.slice(config.prefix.length).trim().split(/\s+/)
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

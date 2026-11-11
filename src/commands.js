import { config } from './config.js';

const menuText = `★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★\n\nPROFACHNEL\n\n${config.prefix}ping  — Check bot response\n${config.prefix}menu  — Show this menu\n${config.prefix}quran <surah> <ayah> — Read an ayah (Urdu)\n\nOnly the configured owner can run commands.`;

export async function handleCommand(sock, message, command, args) {
  const jid = message.key.remoteJid;
  const reply = (text) => sock.sendMessage(jid, { text }, { quoted: message });

  if (command === 'ping') {
    return reply('Pong! MISHU MD is online.');
  }

  if (command === 'menu' || command === 'help') {
    return reply(menuText);
  }

  if (command === 'quran') {
    const surah = Number(args[0]);
    const ayah = Number(args[1]);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
      return reply(`Usage: ${config.prefix}quran <surah 1-114> <ayah>`);
    }
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ur.jalandhry`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Quran API returned ${response.status}`);
      const payload = await response.json();
      if (payload.code !== 200 || !payload.data?.text) throw new Error('Ayah not found');
      return reply(`${payload.data.text}\n\nSurah ${payload.data.surah.number}: ${payload.data.surah.name} — Ayah ${payload.data.numberInSurah}`);
    } catch {
      return reply('Quran service is temporarily unavailable. Please try again later.');
    }
  }

  return reply(`Unknown command. Send ${config.prefix}menu for help.`);
}

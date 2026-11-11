import { config } from './config.js';

const menuText = `★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★
PROFACHNEL

${config.prefix}ping — Check bot response
${config.prefix}menu — Show this menu
${config.prefix}quran <surah> <ayah> — Read an ayah in Urdu
${config.prefix}about — Bot information
${config.prefix}privacy — Privacy and safety settings

Owner-only commands. Auto features are controlled in .env.`;

export async function handleCommand(sock, message, command, args) {
  const jid = message.key.remoteJid;
  const reply = (text) => sock.sendMessage(jid, { text }, { quoted: message });

  if (command === 'ping') return reply('Pong! ★彡 MISHU MD 彡★ is online.');

  if (command === 'menu' || command === 'help') return reply(menuText);

  if (command === 'about') {
    return reply('★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★\nBrand: PROFACHNEL\nRuntime: Node.js + Baileys\nOwner-only command access.');
  }

  if (command === 'privacy') {
    return reply('Privacy defaults:\n• Auto status seen: ' + (config.autoStatusSeen ? 'ON' : 'OFF') +
      '\n• Auto reaction: ' + (config.autoReact ? 'ON' : 'OFF') +
      '\n• Deleted-message archiving: NOT enabled\n• Anti-ban bypass: NOT supported\n• Cooldown and spam protection: ON');
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

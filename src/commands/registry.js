export const commandRegistry = Object.freeze([
  { name: 'ping', description: 'Check whether the bot is responding.', usage: '.ping' },
  { name: 'menu', description: 'Show available commands.', usage: '.menu' },
  { name: 'help', description: 'Show available commands.', usage: '.help' },
  { name: 'quran', description: 'Read an Urdu Quran translation ayah.', usage: '.quran <surah 1-114> <ayah>' },
]);

export function renderMenu(prefix = '.') {
  const lines = commandRegistry.map(({ name, description, usage }) => `${prefix}${name} — ${description}\n  ${usage.replace(/^\./, prefix)}`);
  return ['★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★', 'PROFACHNEL', '', ...lines].join('\n');
}

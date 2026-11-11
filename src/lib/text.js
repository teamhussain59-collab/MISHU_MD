export function normalizeCommand(input = '') {
  return String(input).trim().toLowerCase().replace(/^[.!/]/, '');
}

export function splitCommand(input = '', prefix = '.') {
  const text = String(input).trim();
  if (!text.startsWith(prefix)) return null;
  const [command = '', ...args] = text.slice(prefix.length).trim().split(/\s+/);
  if (!command) return null;
  return { command: command.toLowerCase(), args };
}

export function safeNumber(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

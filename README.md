# ★彡 𝐌𝐈𝐒𝐇𝐔 𝐌𝐃 彡★

**Brand:** PROFACHNEL  
**Pairing website title:** MISHU MD PAIR

A Node.js 20+ WhatsApp bot built with Baileys.

## Included
- Owner-only command handling
- Stylish PROFACHNEL / MISHU MD branding in bot replies
- Ping, menu, about, privacy, and Urdu Quran ayah commands
- Optional auto-status-seen and auto-reaction settings (off by default)
- Command cooldown, safe reconnect handling, and structured logs
- Multi-file authentication state stored locally

## Setup
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set your own WhatsApp number in international format.
4. Run `npm run check` and `npm test`.
5. Run `npm start`. In an interactive terminal, enter your number when prompted; for a private server environment, set `PAIRING_NUMBER` privately before starting.\n6. On your phone, open WhatsApp → Linked devices → Link with phone number, then enter the displayed code. Keep the code private.

## Configuration
- `AUTO_STATUS_SEEN=false`: optionally mark received status updates as seen.
- `AUTO_REACT=false`: optionally react to incoming non-status messages.
- `AUTO_REACT_EMOJI=✨`: reaction used when auto-reaction is enabled.
- `COMMAND_COOLDOWN_MS=3000`: minimum interval between owner commands.

All optional automations are disabled by default. Set them deliberately in your private local `.env`.

## Important limitations
- The bot cannot guarantee immunity from WhatsApp restrictions or bans. Use official, low-volume behavior and stop if the account receives warnings.
- It does not bypass bans, automate bulk messaging, or secretly archive other people's deleted messages.
- WhatsApp profile display name must be set by the account owner in WhatsApp settings; bot replies use the MISHU MD branding.
- Pair only accounts you own or have explicit permission to administer.

## Security
- Never commit `.env`, auth state, session strings, QR data, or tokens.
- Keep the repository free of credentials.
- Respect people's privacy and copyright.

## Runtime
- Node.js 20+
- npm

export function isOwner(senderJid, ownerJid) {
  return Boolean(senderJid && ownerJid && senderJid === ownerJid);
}

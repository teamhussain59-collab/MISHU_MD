import test from 'node:test';
import assert from 'node:assert/strict';
import { isOwner } from '../src/lib/owner.js';

test('only exact configured owner JID is accepted', () => {
  assert.equal(isOwner('923001234567@s.whatsapp.net', '923001234567@s.whatsapp.net'), true);
  assert.equal(isOwner('923001234568@s.whatsapp.net', '923001234567@s.whatsapp.net'), false);
  assert.equal(isOwner('', '923001234567@s.whatsapp.net'), false);
});

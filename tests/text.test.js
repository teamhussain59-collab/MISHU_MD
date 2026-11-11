import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCommand, splitCommand, safeNumber } from '../src/lib/text.js';

test('splitCommand parses command and arguments', () => {
  assert.deepEqual(splitCommand('.quran 2 255'), { command: 'quran', args: ['2', '255'] });
});

test('splitCommand ignores messages without prefix', () => {
  assert.equal(splitCommand('hello'), null);
});

test('normalizeCommand normalizes case and prefix', () => {
  assert.equal(normalizeCommand('.PiNg'), 'ping');
});

test('safeNumber enforces integer range', () => {
  assert.equal(safeNumber('114', 1, 114), 114);
  assert.equal(safeNumber('115', 1, 114), null);
});

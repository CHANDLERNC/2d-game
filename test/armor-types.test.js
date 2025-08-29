import test from 'node:test';
import assert from 'node:assert/strict';
import { ARMOR_TYPES, ARMOR_TYPE_MODS } from '../modules/armorTypes.js';

test('armor type list includes new classes', () => {
  const expected = ['Cloth', 'Leather', 'Heavy Leather', 'Chain Mail', 'Plate', 'Heavy Plate'];
  expected.forEach(t => assert(ARMOR_TYPES.includes(t)));
});

test('armor type stats scale by heaviness', () => {
  assert.ok(ARMOR_TYPE_MODS['Cloth'].armor < ARMOR_TYPE_MODS['Heavy Plate'].armor);
  assert.ok(ARMOR_TYPE_MODS['Cloth'].speedPct > 0);
  assert.ok(ARMOR_TYPE_MODS['Heavy Plate'].speedPct < 0);
});

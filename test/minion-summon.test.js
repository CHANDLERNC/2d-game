import test from 'node:test';
import assert from 'node:assert/strict';
import { minions, spawnMinion } from '../modules/minions.js';

test('spawnMinion adds to minion list', () => {
  minions.length = 0;
  const m = spawnMinion('skeleton', 1, 2);
  assert.equal(minions.length, 1);
  assert.equal(m, minions[0]);
  assert.equal(m.type, 'skeleton');
  assert.equal(m.x, 1);
  assert.equal(m.y, 2);
});

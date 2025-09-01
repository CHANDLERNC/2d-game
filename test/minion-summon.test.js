import test from 'node:test';
import assert from 'node:assert/strict';
import { minions, spawnMinion, MINION_STATS } from '../modules/minions.js';

test('spawnMinion adds to minion list', () => {
  minions.length = 0;
  const m = spawnMinion('skeleton', 1, 2);
  assert.equal(minions.length, 1);
  assert.equal(m, minions[0]);
  assert.equal(m.type, 'skeleton');
  assert.equal(m.x, 1);
  assert.equal(m.y, 2);
});

test('spawnMinion respects per-owner limit and damage multiplier', () => {
  minions.length = 0;
  const owner = 'spell';
  for (let i = 0; i < 5; i++) {
    spawnMinion('skeleton', 0, 0, { owner, limit: 4, dmgMult: 2 });
  }
  assert.equal(minions.filter(m => m.owner === owner).length, 4);
  assert.equal(minions[0].dmgMin, MINION_STATS.skeleton.dmg[0] * 2);
  assert.equal(minions[0].dmgMax, MINION_STATS.skeleton.dmg[1] * 2);
});

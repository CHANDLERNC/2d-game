import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDamage, applyDamageToPlayer, RESIST_CAP } from '../modules/combat.js';

test('armor reduces physical damage', () => {
  const result = calculateDamage(100, { type: 'physical', armor: 50, floor: 1 });
  assert.equal(result, 50);
});

test('resistance reduces elemental damage', () => {
  const result = calculateDamage(100, { type: 'fire', resFire: 25 });
  assert.equal(result, 75);
});

test('custom resistance cap can be provided', () => {
  const result = calculateDamage(100, { type: 'fire', resFire: 100, resistCap: 50 });
  assert.equal(result, 50);
});

test('armor scaling constants are tunable', () => {
  const result = calculateDamage(100, { type: 'physical', armor: 50, floor: 1, armorKBase: 100 });
  assert.equal(result, 66);
});

test('constants are exposed', () => {
  assert.equal(RESIST_CAP, 75);
});

test('applyDamageToPlayer updates hp and returns damage', () => {
  const player = { hp: 100, armor: 0, resFire: 0, resIce: 0, resShock: 0, resMagic: 0, resPoison: 0, x:0, y:0 };
  const damageTexts = [];
  let hit = false;
  let respawn = false;
  const eff = applyDamageToPlayer(player, 30, {
    damageTexts,
    playHit: () => { hit = true; },
    showRespawn: () => { respawn = true; }
  });
  assert.equal(eff, 30);
  assert.equal(player.hp, 70);
  assert.ok(hit);
  assert.equal(respawn, false);
  assert.equal(damageTexts.length, 1);
});

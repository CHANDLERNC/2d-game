import test from 'node:test';
import assert from 'node:assert/strict';
import { skillTrees } from '../modules/player.js';

test('Poison Strike ability defined in rogue tricks skill tree', () => {
  const tricks = skillTrees.tricks;
  assert.ok(tricks, 'tricks skill tree exists');
  const ability = tricks.abilities.find(ab => ab.name === 'Poison Strike');
  assert.ok(ability, 'Poison Strike ability present');
  assert.equal(ability.cast, 'poisonStrike');
  assert.equal(ability.cost, 2);
});

test('Vanish ability defined in rogue tricks skill tree', () => {
  const tricks = skillTrees.tricks;
  assert.ok(tricks, 'tricks skill tree exists');
  const ability = tricks.abilities.find(ab => ab.name === 'Vanish');
  assert.ok(ability, 'Vanish ability present');
  assert.equal(ability.cast, 'vanish');
  assert.equal(ability.cost, 3);
});

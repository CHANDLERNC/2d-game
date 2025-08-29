import test from 'node:test';
import assert from 'node:assert/strict';
import { skillTrees } from '../modules/skillTrees.js';

test('Poison Strike ability defined in rogue assassination skill tree', () => {
  const assassination = skillTrees.rogue.assassination;
  assert.ok(assassination, 'assassination skill tree exists');
  const ability = assassination.abilities.find(ab => ab.name === 'Poison Strike');
  assert.ok(ability, 'Poison Strike ability present');
  assert.equal(ability.cast, 'poisonStrike');
  assert.equal(ability.cost, 2);
});

test('Vanish ability defined in rogue subtlety skill tree', () => {
  const subtlety = skillTrees.rogue.subtlety;
  assert.ok(subtlety, 'subtlety skill tree exists');
  const ability = subtlety.abilities.find(ab => ab.name === 'Vanish');
  assert.ok(ability, 'Vanish ability present');
  assert.equal(ability.cast, 'vanish');
  assert.equal(ability.cost, 3);
});

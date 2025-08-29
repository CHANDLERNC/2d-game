import test from 'node:test';
import assert from 'node:assert/strict';
import { skillTrees } from '../modules/skillTrees.js';

test('Mortal Strike ability defined in warrior arms skill tree', () => {
  const arms = skillTrees.warrior.arms;
  assert.ok(arms, 'arms skill tree exists');
  const ability = arms.abilities.find(ab => ab.name === 'Mortal Strike');
  assert.ok(ability, 'Mortal Strike ability present');
  assert.equal(ability.cost, 1);
});

test('Arcane Missiles ability defined in mage arcane skill tree', () => {
  const arcane = skillTrees.mage.arcane;
  assert.ok(arcane, 'arcane skill tree exists');
  const ability = arcane.abilities.find(ab => ab.name === 'Arcane Missiles');
  assert.ok(ability, 'Arcane Missiles ability present');
  assert.equal(ability.cost, 1);
});

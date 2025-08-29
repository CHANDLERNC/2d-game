import test from 'node:test';
import assert from 'node:assert/strict';
import { skillTrees } from '../modules/player.js';

function findNode(node, name) {
  if (node.name === name) return node;
  for (const child of node.children || []) {
    const found = findNode(child, name);
    if (found) return found;
  }
  return null;
}

test('Poison Strike ability defined in rogue skill tree', () => {
  const rogue = skillTrees.rogue;
  assert.ok(rogue, 'rogue skill tree exists');
  const ability = findNode(rogue, 'Poison Strike');
  assert.ok(ability, 'Poison Strike ability present');
  assert.equal(ability.cast, 'poisonStrike');
  assert.equal(ability.cost, 2);
});

test('Vanish ability defined in rogue skill tree', () => {
  const rogue = skillTrees.rogue;
  assert.ok(rogue, 'rogue skill tree exists');
  const ability = findNode(rogue, 'Vanish');
  assert.ok(ability, 'Vanish ability present');
  assert.equal(ability.cast, 'vanish');
  assert.equal(ability.cost, 3);
});

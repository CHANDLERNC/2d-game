import test from 'node:test';
import assert from 'node:assert/strict';
import { skillTreeGraph } from '../modules/player.js';

function findNode(node, name) {
  if (node.name === name) return node;
  for (const child of node.children || []) {
    const found = findNode(child, name);
    if (found) return found;
  }
  return null;
}

test('Venom Slash ability defined in rogue skill tree', () => {
  const rogue = skillTreeGraph.rogue;
  assert.ok(rogue, 'rogue skill tree exists');
  const ability = findNode(rogue, 'Venom Slash');
  assert.ok(ability, 'Venom Slash ability present');
  assert.equal(ability.cast, 'poisonStrike');
  assert.equal(ability.cost, 2);
});

test('Shadowmeld ability defined in rogue skill tree', () => {
  const rogue = skillTreeGraph.rogue;
  assert.ok(rogue, 'rogue skill tree exists');
  const ability = findNode(rogue, 'Shadowmeld');
  assert.ok(ability, 'Shadowmeld ability present');
  assert.equal(ability.cast, 'vanish');
  assert.equal(ability.cost, 3);
});

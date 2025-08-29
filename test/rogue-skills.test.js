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

test('Backstab and Smoke Bomb abilities are present', () => {
  const rogue = skillTreeGraph.rogue;
  const backstab = findNode(rogue, 'Backstab');
  assert.ok(backstab, 'Backstab ability present');
  assert.equal(backstab.cost, 3);
  const smoke = findNode(rogue, 'Smoke Bomb');
  assert.ok(smoke, 'Smoke Bomb ability present');
  assert.equal(smoke.cast, 'smokeBomb');
  assert.equal(smoke.cost, 5);
});

test('rogue skill tree contains between 12 and 20 abilities', () => {
  function count(node) {
    return 1 + (node.children ? node.children.reduce((s, c) => s + count(c), 0) : 0);
  }
  const total = skillTreeGraph.rogue.children.reduce((sum, branch) => sum + count(branch), 0);
  assert.ok(total >= 12 && total <= 20, `found ${total}`);
});

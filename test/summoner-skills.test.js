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

test('Summon Skeleton ability defined in summoner skill tree', () => {
  const summoner = skillTreeGraph.summoner;
  assert.ok(summoner, 'summoner skill tree exists');
  const ability = findNode(summoner, 'Summon Skeleton');
  assert.ok(ability, 'Summon Skeleton ability present');
  assert.equal(ability.type, 'summon');
  assert.equal(ability.cost, 1);
});

test('Summon Golem ability defined in summoner skill tree', () => {
  const summoner = skillTreeGraph.summoner;
  const ability = findNode(summoner, 'Summon Golem');
  assert.ok(ability, 'Summon Golem ability present');
  assert.equal(ability.type, 'summon');
  assert.equal(ability.cost, 2);
});

test('summoner skill tree contains between 4 and 8 abilities', () => {
  function count(node) {
    return 1 + (node.children ? node.children.reduce((s, c) => s + count(c), 0) : 0);
  }
  const total = skillTreeGraph.summoner.children.reduce((sum, branch) => sum + count(branch), 0);
  assert.ok(total >= 4 && total <= 8, `found ${total}`);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { simpleSkillTreeGraph } from '../modules/simpleSkillTree.js';

test('simple attack branch has linear progression', () => {
  const attack = simpleSkillTreeGraph.attack;
  assert.equal(attack.children[0].name, 'Quick Jab');
  assert.equal(attack.children[0].children[0].name, 'Heavy Swing');
});

test('simple defence branch ends with Guardian ability', () => {
  const defence = simpleSkillTreeGraph.defence;
  const guardian = defence.children[0].children[0].children[0];
  assert.equal(guardian.name, 'Guardian');
  assert.equal(guardian.bonus.armorPct, 10);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { simpleSkillTreeGraph, simpleSkillTrees } from '../modules/simpleSkillTree.js';

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

test('utility branch flattens into a linear ability list', () => {
  const abilities = simpleSkillTrees.utility.abilities;
  assert.deepEqual(
    abilities.map(a => a.name),
    ['Fleet Foot', 'Adrenaline', 'Evasion']
  );
  // Ensure parent indices link each ability sequentially
  assert.equal(abilities[1].parent, 0);
  assert.equal(abilities[2].parent, 1);
});

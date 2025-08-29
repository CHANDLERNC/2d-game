import assert from 'assert';
import test from 'node:test';
import { skillTreeGraph } from '../modules/player.js';

function collectNames(node, set) {
  set.add(node.name);
  if (node.children) {
    for (const child of node.children) {
      collectNames(child, set);
    }
  }
}

test('skill names are unique across classes', () => {
  const classes = Object.keys(skillTreeGraph);
  const namesByClass = {};
  for (const cls of classes) {
    const set = new Set();
    const root = skillTreeGraph[cls];
    // include all names in this class's tree
    collectNames(root, set);
    namesByClass[cls] = set;
  }
  const entries = Object.entries(namesByClass);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, setA] = entries[i];
      const [b, setB] = entries[j];
      const overlap = [...setA].filter(name => setB.has(name));
      assert.strictEqual(
        overlap.length,
        0,
        `Overlapping skills between ${a} and ${b}: ${overlap.join(', ')}`
      );
    }
  }
});

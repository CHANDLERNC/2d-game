import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLayers } from '../modules/rendering.js';

test('renderLayers draws floor and wall layers with camera offset', () => {
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };
  const floor = {};
  const wall = {};
  renderLayers(ctx, floor, wall, 10, 20);
  assert.deepEqual(calls, [[floor, -10, -20], [wall, -10, -20]]);
});

import { strict as assert } from 'assert';
import { map, fog, vis, rooms, torches, lavaTiles, spikeTraps, biomeMap, MAP_W, MAP_H, T_EMPTY, B_FOREST, resetMapState } from '../modules/map.js';

// store original references
const orig = { map, fog, vis, rooms, torches, lavaTiles, spikeTraps, biomeMap };

resetMapState();

// references should remain the same
assert.equal(orig.map, map);
assert.equal(orig.fog, fog);
assert.equal(orig.vis, vis);
assert.equal(orig.rooms, rooms);
assert.equal(orig.torches, torches);
assert.equal(orig.lavaTiles, lavaTiles);
assert.equal(orig.spikeTraps, spikeTraps);
assert.equal(orig.biomeMap, biomeMap);

// ensure sizes and default values
assert.equal(map.length, MAP_W * MAP_H);
assert.equal(fog.length, MAP_W * MAP_H);
assert.equal(vis.length, MAP_W * MAP_H);
assert.equal(rooms.length, 0);
assert.equal(torches.length, 0);
assert.equal(lavaTiles.length, 0);
assert.equal(spikeTraps.length, 0);
assert.equal(biomeMap.length, MAP_W * MAP_H);

assert.ok(map.every(v => v === T_EMPTY));
assert.ok(fog.every(v => v === 0));
assert.ok(vis.every(v => v === 0));
assert.ok(biomeMap.every(v => v === B_FOREST));

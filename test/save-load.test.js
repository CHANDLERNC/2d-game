import test from 'node:test';
import assert from 'node:assert/strict';

import { player } from '../modules/player.js';
import { inventory, SLOTS } from '../modules/playerInventory.js';
import { getSaveData, applySaveData } from '../modules/saveLoad.js';

function setupState(){
  // ensure known clean state? after import player & inventory already set.
  // We'll reset arrays/equip to ensure test isolation
  inventory.equip = Object.fromEntries(SLOTS.map(s => [s, null]));
  inventory.bag = new Array(inventory.bag.length).fill(null);
  inventory.potionBag = new Array(inventory.potionBag.length).fill(null);
  player.skillPoints = 0;
  player.magicPoints = 0;
  for(const tree in player.skills){
    player.skills[tree] = player.skills[tree].map(()=>false);
  }
  for(const tree in player.magic){
    player.magic[tree] = player.magic[tree].map(()=>false);
  }
  player.boundSkill = null;
  player.boundSpell = null;
}

test('inventory and abilities persist through save data', () => {
  setupState();
  // give player some state
  inventory.equip.weapon = { name: 'Sword of Tests' };
  inventory.equip.necklace = { name: 'Amulet of Tests' };
  inventory.bag[0] = { name: 'Health Potion' };
  inventory.potionBag[0] = { name: 'Mana Potion' };
  player.skillPoints = 2;
  player.magicPoints = 3;
  player.skills.berserkerBattle[0] = true;
  player.magic.spellbinderHealing[0] = true;
  player.boundSkill = { tree: 'berserkerBattle', idx: 0 };
  player.boundSpell = { tree: 'spellbinderHealing', idx: 0 };

  const data = getSaveData();

  // mutate state to ensure we actually restore from save
  setupState();

  applySaveData(data);

  assert.equal(inventory.equip.weapon.name, 'Sword of Tests');
  assert.equal(inventory.bag[0].name, 'Health Potion');
  assert.equal(inventory.potionBag[0].name, 'Mana Potion');
  assert.equal(inventory.equip.necklace.name, 'Amulet of Tests');
  assert.equal(player.skillPoints, 2);
  assert.equal(player.magicPoints, 3);
  assert.ok(player.skills.berserkerBattle[0]);
  assert.ok(player.magic.spellbinderHealing[0]);
  assert.deepEqual(player.boundSkill, { tree: 'berserkerBattle', idx: 0 });
  assert.deepEqual(player.boundSpell, { tree: 'spellbinderHealing', idx: 0 });

  // clean up to avoid affecting other tests
  setupState();
});

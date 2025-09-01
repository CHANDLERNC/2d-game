import { player } from './player.js';
import { inventory, BAG_SIZE, POTION_BAG_SIZE } from './playerInventory.js';

const deepClone = obj => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};

function getSaveData() {
  return deepClone({
    player: {
      class: player.class,
      lvl: player.lvl,
      gold: player.gold,
      skillPoints: player.skillPoints,
      magicPoints: player.magicPoints,
      skills: player.skills,
      magic: player.magic,
      boundSkill: player.boundSkill,
      boundSpell: player.boundSpell
    },
    inventory: {
      equip: inventory.equip,
      bag: inventory.bag,
      potionBag: inventory.potionBag
    }
  });
}

function applySaveData(data = {}) {
  const p = data.player || {};
  player.class = p.class ?? player.class;
  player.lvl = p.lvl ?? player.lvl;
  player.gold = p.gold ?? 0;
  player.skillPoints = p.skillPoints ?? 0;
  player.magicPoints = p.magicPoints ?? 0;
  player.skills = deepClone(p.skills || player.skills);
  player.magic = deepClone(p.magic || player.magic);
  player.boundSkill = p.boundSkill ?? null;
  player.boundSpell = p.boundSpell ?? null;

  const inv = data.inventory || {};
  // Default equipment now includes necklace and two ring slots
  inventory.equip = deepClone(
    inv.equip || {
      helmet: null,
      necklace: null,
      chest: null,
      legs: null,
      hands: null,
      feet: null,
      ring1: null,
      ring2: null,
      weapon: null,
    }
  );
  inventory.bag = deepClone(inv.bag || new Array(BAG_SIZE).fill(null));
  inventory.potionBag = deepClone(inv.potionBag || new Array(POTION_BAG_SIZE).fill(null));

  // keep player references in sync
  player.equip = inventory.equip;
  player.bag = inventory.bag;
  player.potionBag = inventory.potionBag;
}

export { getSaveData, applySaveData };

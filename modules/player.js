// Aggregates player-related modules for convenience.
import { stats } from './playerStats.js';
import { inventory } from './playerInventory.js';
import { progression } from './playerProgression.js';

const player = {
  x: 0,
  y: 0,
  stepCD: 0,
  stepDelay: 140,
  speedPct: 0,
  atkCD: 0,
  combatTimer: 0,
  healAcc: 0,
  manaAcc: 0,
  stamAcc: 0,
  faceDx: 1,
  faceDy: 0,
  effects: []
};

Object.assign(player, stats, inventory, progression);

let playerSpriteKey = 'player_warrior';

// Generic node factory for skill tree creation
function node(data, children = []) {
  return { ...data, children };
}

// Original hierarchical skill tree data used by tests
const skillTreeGraph = {
  warrior: node({ name: 'Berserker' }, [
    node({ name: 'Battle Instinct', desc: 'Increase critical chance by 5%.', bonus: { crit: 5 }, cost: 1 }, [
      node({ name: 'Frenzied Blows', desc: 'Increase attack damage by 2.', bonus: { dmgMin: 2, dmgMax: 2 }, cost: 2 }, [
        node({ name: 'Crushing Swing', desc: 'Increase attack damage by 3.', bonus: { dmgMin: 3, dmgMax: 3 }, cost: 3 }, [
          node({ name: 'Earthshaker', desc: 'Increase attack damage by 4.', bonus: { dmgMin: 4, dmgMax: 4 }, cost: 4 }, [
            node({ name: 'Bloodthirst', desc: 'Increase attack damage by 5.', bonus: { dmgMin: 5, dmgMax: 5 }, cost: 5 }, [
              node({ name: 'Overwhelm', desc: 'Increase attack damage by 6.', bonus: { dmgMin: 6, dmgMax: 6 }, cost: 9 })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Endurance', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 1 }, [
      node({ name: 'Iron Wall', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 2 }, [
        node({ name: 'Stone Guard', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 3 }, [
          node({ name: 'Plate Skin', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 4 }, [
            node({ name: 'Sentinel', desc: 'Increase max HP by 30.', bonus: { hpMax: 30 }, cost: 5 }, [
              node({ name: 'Unyielding', desc: 'Increase armor by 6.', bonus: { armor: 6 }, cost: 7 }, [
                node({ name: 'Aegis', desc: 'Increase armor by 15%.', bonus: { armorPct: 15 }, cost: 9 })
              ])
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Raging Strike', desc: 'Spend 20 stamina to strike for 40% more damage.', cost: 1, cast: 'powerStrike' }, [
      node({ name: 'Blade Cyclone', desc: 'Spin and hit nearby foes for 60% more damage (30 stamina).', cost: 2, cast: 'whirlwind' }, [
        node({ name: 'Thunder Bash', desc: 'Bash an enemy for 80% more damage and shock them (15 stamina).', cost: 3, cast: 'shieldBash' })
      ])
    ])
  ]),

  mage: node({ name: 'Spellbinder' }, [
    node({ name: 'Minor Mend', type: 'heal', value: 30, mp: 10, cost: 1 }, [
      node({ name: 'Major Mend', type: 'heal', value: 60, mp: 20, cost: 2 }, [
        node({ name: 'Greater Mend', type: 'heal', value: 120, mp: 30, cost: 3 }, [
          node({ name: 'Arcane Renewal', type: 'heal', value: null, mp: 40, cost: 4 }, [
            node({ name: 'Mystic Restoration', type: 'heal', value: null, mp: 60, cost: 5 }, [
              node({ name: 'Celestial Radiance', type: 'heal', value: null, mp: 80, cost: 9 })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Flame Bolt', type: 'damage', dmg: 15, mp: 10, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2000, power: 1.0, chance: 1 } }, [
      node({ name: 'Frost Spike', type: 'damage', dmg: 40, mp: 15, cost: 2, range: 8, elem: 'ice', status: { k: 'freeze', dur: 1800, power: 0.4, chance: 1 } }, [
        node({ name: 'Storm Bolt', type: 'damage', dmg: 65, mp: 20, cost: 3, range: 9, elem: 'shock', status: { k: 'shock', dur: 2000, power: 0.25, chance: 1 } }, [
          node({ name: 'Arcane Burst', type: 'damage', dmg: 90, mp: 30, cost: 4, range: 9, elem: 'magic' }, [
            node({ name: 'Falling Star', type: 'damage', dmg: 120, mp: 40, cost: 5, range: 9, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.5, chance: 1 } }, [
              node({ name: 'Astral Ray', type: 'damage', dmg: 150, mp: 60, cost: 9, range: 10, elem: 'magic' })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Spark', type: 'dot', dmg: 8, mp: 12, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2200, power: 1.0, chance: 1 } }, [
      node({ name: 'Ember', type: 'dot', dmg: 18, mp: 16, cost: 2, range: 8, elem: 'fire', status: { k: 'burn', dur: 2600, power: 1.1, chance: 1 } }, [
        node({ name: 'Blaze', type: 'dot', dmg: 28, mp: 20, cost: 3, range: 8, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.2, chance: 1 } }, [
          node({ name: 'Wildfire', type: 'dot', dmg: 38, mp: 25, cost: 4, range: 8, elem: 'fire', status: { k: 'burn', dur: 3400, power: 1.3, chance: 1 } }, [
            node({ name: 'Firestorm', type: 'dot', dmg: 48, mp: 28, cost: 5, range: 8, elem: 'fire', status: { k: 'burn', dur: 3800, power: 1.4, chance: 1 } }, [
              node({ name: 'Cataclysm', type: 'dot', dmg: 60, mp: 35, cost: 9, range: 8, elem: 'fire', status: { k: 'burn', dur: 4200, power: 1.5, chance: 1 } })
            ])
          ])
        ])
      ])
    ])
  ]),

  rogue: node({ name: 'Nightblade' }, [
    node({ name: 'Keen Aim', desc: 'Increase critical chance by 10%.', bonus: { crit: 10 }, cost: 1 }, [
      node({ name: 'Venom Slash', desc: 'Spend 20 stamina to strike and poison an enemy.', cost: 2, cast: 'poisonStrike' }, [
        node({ name: 'Backstab', desc: 'Deal 50% more damage when striking from behind.', bonus: { backstab: 50 }, cost: 3 }, [
          node({ name: 'Lethal Precision', desc: 'Increase critical damage by 20%.', bonus: { critDmg: 20 }, cost: 4 }, [
            node({ name: 'Assassinate', desc: 'Finishing move for 100% more damage (30 stamina).', cost: 5, cast: 'assassinate' }, [
              node({ name: 'Death Blossom', desc: 'Spin and strike nearby foes for 120% damage (35 stamina).', cost: 7, cast: 'deathBlossom' })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Evasion Training', desc: 'Increase dodge chance by 5%.', bonus: { dodge: 5 }, cost: 1 }, [
      node({ name: 'Shadowmeld', desc: 'Spend 25 stamina to become invisible for 4 seconds.', cost: 3, cast: 'vanish' }, [
        node({ name: 'Silent Step', desc: 'Increase movement speed by 10% while stealthed.', bonus: { stealthSpeedPct: 10 }, cost: 4 }, [
          node({ name: 'Smoke Bomb', desc: 'Create a smoke cloud that blinds enemies for 3 seconds (20 stamina).', cost: 5, cast: 'smokeBomb' }, [
            node({ name: 'Master of Shadows', desc: 'Increase stealth duration by 2 seconds.', bonus: { stealthDur: 2 }, cost: 6 }, [
              node({ name: 'Shadowmaster', desc: 'Attacks from stealth deal 50% more damage.', bonus: { stealthDmg: 50 }, cost: 8 })
            ])
          ])
        ])
    ])
  ])
  ]),

  summoner: node({ name: 'Soulcaller' }, [
    node({ name: 'Summon Skeleton', type: 'summon', mp: 15, cost: 1 }, [
      node({ name: 'Summon Golem', type: 'summon', mp: 30, cost: 2 })
    ]),
    node({ name: 'Empower Minions', desc: 'Increase minion damage by 10%.', bonus: { minionDmg: 10 }, cost: 1 }, [
      node({ name: 'Horde Mastery', desc: 'Increase max minions by 1.', bonus: { maxMinions: 1 }, cost: 2 })
    ])
  ])
};

// Convert the hierarchical graph above into the linear structures used by the
// existing UI. This keeps the game logic simple while allowing tests to inspect
// the full skill tree relationships.
function flattenBranch(branch) {
  const abilities = [];
  (function traverse(node, parent = -1) {
    const { children = [], ...data } = node;
    const idx = abilities.length;
    abilities.push({ ...data, parent });
    children.forEach(child => traverse(child, idx));
  })(branch);
  return abilities;
}

// Build mage and summoner spell trees (magic) from the graph
const [healBranch, dmgBranch, dotBranch] = skillTreeGraph.mage.children;
const summonerBranches = skillTreeGraph.summoner.children;
const magicTrees = {
  spellbinderHealing: {
    display: 'Healing',
    class: 'mage',
    abilities: flattenBranch(healBranch)
  },
  spellbinderDamage: {
    display: 'Damage',
    class: 'mage',
    abilities: flattenBranch(dmgBranch)
  },
  spellbinderDot: {
    display: 'Damage over Time',
    class: 'mage',
    abilities: flattenBranch(dotBranch)
  },
  soulcallerSummoning: {
    display: 'Summoning',
    class: 'summoner',
    abilities: flattenBranch(summonerBranches[0])
  },
  soulcallerMastery: {
    display: 'Minion Mastery',
    class: 'summoner',
    abilities: flattenBranch(summonerBranches[1])
  }
};

// Build skill trees for non-mage classes
const warriorBranches = skillTreeGraph.warrior.children;
const rogueBranches = skillTreeGraph.rogue.children;
const skillTrees = {
  berserkerBattle: {
    display: warriorBranches[0].name,
    class: 'warrior',
    abilities: flattenBranch(warriorBranches[0]),
    graph: warriorBranches[0]
  },
  berserkerEndurance: {
    display: warriorBranches[1].name,
    class: 'warrior',
    abilities: flattenBranch(warriorBranches[1]),
    graph: warriorBranches[1]
  },
  berserkerRage: {
    display: warriorBranches[2].name,
    class: 'warrior',
    abilities: flattenBranch(warriorBranches[2]),
    graph: warriorBranches[2]
  },
  nightbladeAssassination: {
    display: 'Assassination',
    class: 'rogue',
    abilities: flattenBranch(rogueBranches[0]),
    graph: rogueBranches[0]
  },
  nightbladeShadow: {
    display: 'Shadow Arts',
    class: 'rogue',
    abilities: flattenBranch(rogueBranches[1]),
    graph: rogueBranches[1]
  }
};

// Initialize player progression structures
player.magic = {};
for (const t in magicTrees) {
  player.magic[t] = new Array(magicTrees[t].abilities.length).fill(false);
}

player.skills = {};
for (const t in skillTrees) {
  player.skills[t] = new Array(skillTrees[t].abilities.length).fill(false);
}

// Reference the appropriate tree for the player's current class
player.skillTree = skillTreeGraph[player.class];

function updatePlayerSprite() {
  if (player.class === 'mage') {
    playerSpriteKey = 'player_mage';
  } else if (player.class === 'summoner') {
    playerSpriteKey = 'player_summoner';
  } else if (player.class === 'rogue') {
    playerSpriteKey = 'player_rogue';
  } else {
    playerSpriteKey = 'player_warrior';
  }
}

export { player, playerSpriteKey, magicTrees, skillTrees, skillTreeGraph, updatePlayerSprite };
export { stats, inventory, progression };

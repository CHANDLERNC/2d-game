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
      node({ name: 'Venom Slash', desc: 'Spend 20 stamina to strike and poison an enemy.', cost: 2, cast: 'poisonStrike' }),
      node({ name: 'Shadowmeld', desc: 'Spend 25 stamina to become invisible for 4 seconds.', cost: 3, cast: 'vanish' })
    ])
  ])
};

// Linearized trees used by the game UI
const magicTrees = {
  healing: {
    display: 'Healing',
    abilities: [
      { name: 'Minor Mend', type: 'heal', value: 30, mp: 10, cost: 1 },
      { name: 'Major Mend', type: 'heal', value: 60, mp: 20, cost: 2 },
      { name: 'Greater Mend', type: 'heal', value: 120, mp: 30, cost: 3 },
      { name: 'Arcane Renewal', type: 'heal', value: null, mp: 40, cost: 4 },
      { name: 'Mystic Restoration', type: 'heal', value: null, mp: 60, cost: 5 },
      { name: 'Celestial Radiance', type: 'heal', value: null, mp: 80, cost: 9 }
    ]
  },
  damage: {
    display: 'Damage',
    abilities: [
      { name: 'Flame Bolt', type: 'damage', dmg: 15, mp: 10, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2000, power: 1.0, chance: 1 } },
      { name: 'Frost Spike', type: 'damage', dmg: 40, mp: 15, cost: 2, range: 8, elem: 'ice', status: { k: 'freeze', dur: 1800, power: 0.4, chance: 1 } },
      { name: 'Storm Bolt', type: 'damage', dmg: 65, mp: 20, cost: 3, range: 9, elem: 'shock', status: { k: 'shock', dur: 2000, power: 0.25, chance: 1 } },
      { name: 'Arcane Burst', type: 'damage', dmg: 90, mp: 30, cost: 4, range: 9, elem: 'magic' },
      { name: 'Falling Star', type: 'damage', dmg: 120, mp: 40, cost: 5, range: 9, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.5, chance: 1 } },
      { name: 'Astral Ray', type: 'damage', dmg: 150, mp: 60, cost: 9, range: 10, elem: 'magic' }
    ]
  },
  dot: {
    display: 'Damage over Time',
    abilities: [
      { name: 'Spark', type: 'dot', dmg: 8, mp: 12, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2200, power: 1.0, chance: 1 } },
      { name: 'Ember', type: 'dot', dmg: 18, mp: 16, cost: 2, range: 8, elem: 'fire', status: { k: 'burn', dur: 2600, power: 1.1, chance: 1 } },
      { name: 'Blaze', type: 'dot', dmg: 28, mp: 20, cost: 3, range: 8, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.2, chance: 1 } },
      { name: 'Wildfire', type: 'dot', dmg: 38, mp: 25, cost: 4, range: 8, elem: 'fire', status: { k: 'burn', dur: 3400, power: 1.3, chance: 1 } },
      { name: 'Firestorm', type: 'dot', dmg: 48, mp: 28, cost: 5, range: 8, elem: 'fire', status: { k: 'burn', dur: 3800, power: 1.4, chance: 1 } },
      { name: 'Cataclysm', type: 'dot', dmg: 60, mp: 35, cost: 9, range: 8, elem: 'fire', status: { k: 'burn', dur: 4200, power: 1.5, chance: 1 } }
    ]
  }
};

const skillTrees = {
  battle: {
    display: 'Battle Instinct',
    class: 'warrior',
    abilities: [
      { name: 'Battle Instinct', desc: 'Increase critical chance by 5%.', bonus: { crit: 5 }, cost: 1 },
      { name: 'Frenzied Blows', desc: 'Increase attack damage by 2.', bonus: { dmgMin: 2, dmgMax: 2 }, cost: 2 },
      { name: 'Crushing Swing', desc: 'Increase attack damage by 3.', bonus: { dmgMin: 3, dmgMax: 3 }, cost: 3 },
      { name: 'Earthshaker', desc: 'Increase attack damage by 4.', bonus: { dmgMin: 4, dmgMax: 4 }, cost: 4 },
      { name: 'Bloodthirst', desc: 'Increase attack damage by 5.', bonus: { dmgMin: 5, dmgMax: 5 }, cost: 5 },
      { name: 'Overwhelm', desc: 'Increase attack damage by 6.', bonus: { dmgMin: 6, dmgMax: 6 }, cost: 9 }
    ]
  },
  endurance: {
    display: 'Endurance',
    class: 'warrior',
    abilities: [
      { name: 'Endurance', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 1 },
      { name: 'Iron Wall', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 2 },
      { name: 'Stone Guard', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 3 },
      { name: 'Plate Skin', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 4 },
      { name: 'Sentinel', desc: 'Increase max HP by 30.', bonus: { hpMax: 30 }, cost: 5 },
      { name: 'Unyielding', desc: 'Increase armor by 6.', bonus: { armor: 6 }, cost: 7 },
      { name: 'Aegis', desc: 'Increase armor by 15%.', bonus: { armorPct: 15 }, cost: 9 }
    ]
  },
  warriorSkills: {
    display: 'Raging Strike',
    class: 'warrior',
    abilities: [
      { name: 'Raging Strike', desc: 'Spend 20 stamina to strike for 40% more damage.', cost: 1, cast: 'powerStrike' },
      { name: 'Blade Cyclone', desc: 'Spin and hit nearby foes for 60% more damage (30 stamina).', cost: 2, cast: 'whirlwind' },
      { name: 'Thunder Bash', desc: 'Bash an enemy for 80% more damage and shock them (15 stamina).', cost: 3, cast: 'shieldBash' }
    ]
  },
  rogue: {
    display: 'Nightblade',
    class: 'rogue',
    abilities: [
      { name: 'Keen Aim', desc: 'Increase critical chance by 10%.', bonus: { crit: 10 }, cost: 1 },
      { name: 'Venom Slash', desc: 'Spend 20 stamina to strike and poison an enemy.', cost: 2, cast: 'poisonStrike' },
      { name: 'Shadowmeld', desc: 'Spend 25 stamina to become invisible for 4 seconds.', cost: 3, cast: 'vanish' }
    ]
  }
};

player.magic = {};
for (const t in magicTrees) {
  player.magic[t] = new Array(magicTrees[t].abilities.length).fill(false);
}

player.skills = {};
for (const t in skillTrees) {
  player.skills[t] = new Array(skillTrees[t].abilities.length).fill(false);
}

function updatePlayerSprite() {
  if (player.class === 'mage') {
    playerSpriteKey = 'player_mage';
  } else if (player.class === 'rogue') {
    playerSpriteKey = 'player_rogue';
  } else {
    playerSpriteKey = 'player_warrior';
  }
}

export { player, playerSpriteKey, magicTrees, skillTrees, skillTreeGraph, updatePlayerSprite };
export { stats, inventory, progression };

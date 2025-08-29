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

const skillTrees = {
  warrior: node({ name: 'Warrior' }, [
    node({ name: 'Precision', desc: 'Increase critical chance by 5%.', bonus: { crit: 5 }, cost: 1 }, [
      node({ name: 'Berserk', desc: 'Increase attack damage by 2.', bonus: { dmgMin: 2, dmgMax: 2 }, cost: 2 }, [
        node({ name: 'Cleave', desc: 'Increase attack damage by 3.', bonus: { dmgMin: 3, dmgMax: 3 }, cost: 3 }, [
          node({ name: 'Earthshatter', desc: 'Increase attack damage by 4.', bonus: { dmgMin: 4, dmgMax: 4 }, cost: 4 }, [
            node({ name: 'Bloodlust', desc: 'Increase attack damage by 5.', bonus: { dmgMin: 5, dmgMax: 5 }, cost: 5 }, [
              node({ name: 'Dominance', desc: 'Increase attack damage by 6.', bonus: { dmgMin: 6, dmgMax: 6 }, cost: 9 })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Toughness', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 1 }, [
      node({ name: 'Shield Wall', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 2 }, [
        node({ name: 'Fortify', desc: 'Increase max HP by 20.', bonus: { hpMax: 20 }, cost: 3 }, [
          node({ name: 'Stone Skin', desc: 'Increase armor by 4.', bonus: { armor: 4 }, cost: 4 }, [
            node({ name: 'Guardian', desc: 'Increase max HP by 30.', bonus: { hpMax: 30 }, cost: 5 }, [
              node({ name: 'Unbreakable', desc: 'Increase armor by 6.', bonus: { armor: 6 }, cost: 7 }, [
                node({ name: 'Bulwark', desc: 'Increase armor by 15%.', bonus: { armorPct: 15 }, cost: 9 })
              ])
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Power Strike', desc: 'Spend 20 stamina to strike for 40% more damage.', cost: 1, cast: 'powerStrike' }, [
      node({ name: 'Whirlwind', desc: 'Spin and hit nearby foes for 60% more damage (30 stamina).', cost: 2, cast: 'whirlwind' }, [
        node({ name: 'Shield Bash', desc: 'Bash an enemy for 80% more damage and shock them (15 stamina).', cost: 3, cast: 'shieldBash' })
      ])
    ])
  ]),

  mage: node({ name: 'Mage' }, [
    node({ name: 'Heal I', type: 'heal', value: 30, mp: 10, cost: 1 }, [
      node({ name: 'Heal II', type: 'heal', value: 60, mp: 20, cost: 2 }, [
        node({ name: 'Heal III', type: 'heal', value: 120, mp: 30, cost: 3 }, [
          node({ name: 'Heal IV', type: 'heal', value: null, mp: 40, cost: 4 }, [
            node({ name: 'Heal V', type: 'heal', value: null, mp: 60, cost: 5 }, [
              node({ name: 'Divine Light', type: 'heal', value: null, mp: 80, cost: 9 })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Fire Bolt', type: 'damage', dmg: 15, mp: 10, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2000, power: 1.0, chance: 1 } }, [
      node({ name: 'Ice Spike', type: 'damage', dmg: 40, mp: 15, cost: 2, range: 8, elem: 'ice', status: { k: 'freeze', dur: 1800, power: 0.4, chance: 1 } }, [
        node({ name: 'Lightning Bolt', type: 'damage', dmg: 65, mp: 20, cost: 3, range: 9, elem: 'shock', status: { k: 'shock', dur: 2000, power: 0.25, chance: 1 } }, [
          node({ name: 'Arcane Blast', type: 'damage', dmg: 90, mp: 30, cost: 4, range: 9, elem: 'magic' }, [
            node({ name: 'Meteor', type: 'damage', dmg: 120, mp: 40, cost: 5, range: 9, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.5, chance: 1 } }, [
              node({ name: 'Void Ray', type: 'damage', dmg: 150, mp: 60, cost: 9, range: 10, elem: 'magic' })
            ])
          ])
        ])
      ])
    ]),
    node({ name: 'Ignite', type: 'dot', dmg: 8, mp: 12, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2200, power: 1.0, chance: 1 } }, [
      node({ name: 'Scorch', type: 'dot', dmg: 18, mp: 16, cost: 2, range: 8, elem: 'fire', status: { k: 'burn', dur: 2600, power: 1.1, chance: 1 } }, [
        node({ name: 'Sear', type: 'dot', dmg: 28, mp: 20, cost: 3, range: 8, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.2, chance: 1 } }, [
          node({ name: 'Inferno', type: 'dot', dmg: 38, mp: 25, cost: 4, range: 8, elem: 'fire', status: { k: 'burn', dur: 3400, power: 1.3, chance: 1 } }, [
            node({ name: 'Conflagrate', type: 'dot', dmg: 48, mp: 28, cost: 5, range: 8, elem: 'fire', status: { k: 'burn', dur: 3800, power: 1.4, chance: 1 } }, [
              node({ name: 'Hellfire', type: 'dot', dmg: 60, mp: 35, cost: 9, range: 8, elem: 'fire', status: { k: 'burn', dur: 4200, power: 1.5, chance: 1 } })
            ])
          ])
        ])
      ])
    ])
  ]),

  rogue: node({ name: 'Rogue' }, [
    node({ name: 'Deadly Precision', desc: 'Increase critical chance by 10%.', bonus: { crit: 10 }, cost: 1 }, [
      node({ name: 'Poison Strike', desc: 'Spend 20 stamina to strike and poison an enemy.', cost: 2, cast: 'poisonStrike' }),
      node({ name: 'Vanish', desc: 'Spend 25 stamina to become invisible for 4 seconds.', cost: 3, cast: 'vanish' })
    ])
  ])
};

function updatePlayerSprite() {
  if (player.class === 'mage') {
    playerSpriteKey = 'player_mage';
  } else if (player.class === 'rogue') {
    playerSpriteKey = 'player_rogue';
  } else {
    playerSpriteKey = 'player_warrior';
  }
}

export { player, playerSpriteKey, skillTrees, updatePlayerSprite };
export { stats, inventory, progression };

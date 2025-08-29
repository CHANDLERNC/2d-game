// Defines class-specific skill trees based on popular RPG examples.
const skillTrees = {
  warrior: {
    arms: {
      display: 'Arms',
      abilities: [
        { name: 'Mortal Strike', desc: 'A powerful strike dealing extra damage.', bonus: { dmgMin: 3, dmgMax: 3 }, cost: 1 },
        { name: 'Slam', desc: 'Heavy blow that further increases damage.', bonus: { dmgMin: 5, dmgMax: 5 }, cost: 2 },
        { name: 'Rend', desc: 'Bleed the target for damage over time.', cast: 'rend', cost: 3 }
      ]
    },
    fury: {
      display: 'Fury',
      abilities: [
        { name: 'Enrage', desc: 'Increase attack speed by 10%.', bonus: { atkSpd: 10 }, cost: 1 },
        { name: 'Bloodthirst', desc: 'A brutal attack that heals you for part of the damage dealt.', cast: 'bloodthirst', cost: 2 },
        { name: 'Whirlwind', desc: 'Spin and strike nearby foes.', cast: 'whirlwind', cost: 3 }
      ]
    },
    protection: {
      display: 'Protection',
      abilities: [
        { name: 'Shield Block', desc: 'Increase armor significantly.', bonus: { armor: 3 }, cost: 1 },
        { name: 'Last Stand', desc: 'Temporarily gain bonus health.', cast: 'lastStand', cost: 2 },
        { name: 'Defensive Stance', desc: 'Reduce damage taken.', bonus: { dmgReduction: 10 }, cost: 3 }
      ]
    }
  },
  mage: {
    fire: {
      display: 'Fire',
      abilities: [
        { name: 'Fireball', type: 'damage', dmg: 25, mp: 10, cost: 1, range: 8, elem: 'fire', status: { k: 'burn', dur: 2000, power: 1.0, chance: 1 } },
        { name: 'Flamestrike', type: 'damage', dmg: 45, mp: 20, cost: 2, range: 8, elem: 'fire', status: { k: 'burn', dur: 3000, power: 1.2, chance: 1 } },
        { name: 'Pyroblast', type: 'damage', dmg: 70, mp: 30, cost: 3, range: 9, elem: 'fire', status: { k: 'burn', dur: 4000, power: 1.4, chance: 1 } }
      ]
    },
    frost: {
      display: 'Frost',
      abilities: [
        { name: 'Frostbolt', type: 'damage', dmg: 20, mp: 8, cost: 1, range: 8, elem: 'ice', status: { k: 'freeze', dur: 1800, power: 0.4, chance: 1 } },
        { name: 'Ice Lance', type: 'damage', dmg: 35, mp: 15, cost: 2, range: 8, elem: 'ice', status: { k: 'freeze', dur: 2000, power: 0.5, chance: 1 } },
        { name: 'Blizzard', type: 'damage', dmg: 55, mp: 25, cost: 3, range: 9, elem: 'ice', status: { k: 'freeze', dur: 3000, power: 0.6, chance: 1 } }
      ]
    },
    arcane: {
      display: 'Arcane',
      abilities: [
        { name: 'Arcane Missiles', type: 'damage', dmg: 30, mp: 12, cost: 1, range: 8, elem: 'magic' },
        { name: 'Arcane Explosion', type: 'damage', dmg: 50, mp: 20, cost: 2, range: 7, elem: 'magic' },
        { name: 'Arcane Power', desc: 'Increase magic damage by 20% for a short time.', cast: 'arcanePower', cost: 3 }
      ]
    }
  },
  rogue: {
    assassination: {
      display: 'Assassination',
      abilities: [
        { name: 'Backstab', desc: 'Strike from behind for extra damage.', cast: 'backstab', cost: 1 },
        { name: 'Poison Strike', desc: 'Coat your weapon with poison for extra damage over time.', cast: 'poisonStrike', cost: 2 },
        { name: 'Mutilate', desc: 'Dual strike causing heavy damage.', cast: 'mutilate', cost: 3 }
      ]
    },
    combat: {
      display: 'Combat',
      abilities: [
        { name: 'Sinister Strike', desc: 'A vicious melee attack.', cast: 'sinisterStrike', cost: 1 },
        { name: 'Blade Flurry', desc: 'Attack two nearby enemies at once.', cast: 'bladeFlurry', cost: 2 },
        { name: 'Adrenaline Rush', desc: 'Temporarily increases attack speed.', cast: 'adrenalineRush', cost: 3 }
      ]
    },
    subtlety: {
      display: 'Subtlety',
      abilities: [
        { name: 'Stealth', desc: 'Become invisible to enemies.', cast: 'stealth', cost: 1 },
        { name: 'Shadowstep', desc: 'Teleport behind an enemy.', cast: 'shadowstep', cost: 2 },
        { name: 'Vanish', desc: 'Disappear from sight, dropping enemy attention.', cast: 'vanish', cost: 3 }
      ]
    }
  }
};

export { skillTrees };

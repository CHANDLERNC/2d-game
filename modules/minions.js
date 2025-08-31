export const minions = [];

const MINION_STATS = {
  skeleton: { hp: 15, dmg: [2, 4], sprite: 'skeleton', stepDelay: 300, atkDelay: 600 },
  golem: { hp: 25, dmg: [4, 6], sprite: 'goblin', stepDelay: 400, atkDelay: 800 },
  demon: { hp: 20, dmg: [5, 8], sprite: 'mage', stepDelay: 300, atkDelay: 700 },
  dragon: { hp: 30, dmg: [6, 10], sprite: 'dragon_hatchling', stepDelay: 300, atkDelay: 650 }
};

export function spawnMinion(type, x, y) {
  const cfg = MINION_STATS[type] || MINION_STATS.skeleton;
  const m = {
    type,
    x,
    y,
    rx: x,
    ry: y,
    hpMax: cfg.hp,
    hp: cfg.hp,
    dmgMin: cfg.dmg[0],
    dmgMax: cfg.dmg[1],
    spriteKey: cfg.sprite,
    stepDelay: cfg.stepDelay,
    atkDelay: cfg.atkDelay,
    atkCD: 0,
    stepCD: 0,
    moving: false,
    moveT: 1,
    moveDur: cfg.stepDelay
  };
  minions.push(m);
  return m;
}

export { MINION_STATS };

export const minions = [];

const MINION_STATS = {
  skeleton: { hp: 15, dmg: [2, 4], sprite: 'skeleton', stepDelay: 300, atkDelay: 600 },
  golem: { hp: 25, dmg: [4, 6], sprite: 'goblin', stepDelay: 400, atkDelay: 800 },
  demon: { hp: 20, dmg: [5, 8], sprite: 'mage', stepDelay: 300, atkDelay: 700 }
};

export function spawnMinion(type, x, y, opts = {}) {
  const { owner, limit = Infinity, dmgMult = 1 } = opts;
  if (owner && Number.isFinite(limit)) {
    const count = minions.filter(m => m.owner === owner).length;
    if (count >= limit) return null;
  }
  const cfg = MINION_STATS[type] || MINION_STATS.skeleton;
  const m = {
    type,
    owner,
    x,
    y,
    rx: x,
    ry: y,
    hpMax: cfg.hp,
    hp: cfg.hp,
    dmgMin: Math.round(cfg.dmg[0] * dmgMult),
    dmgMax: Math.round(cfg.dmg[1] * dmgMult),
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

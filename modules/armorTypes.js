export const ARMOR_TYPE_MODS = {
  Cloth: { armor: 1, speedPct: 10, mpMax: 20 },
  Leather: { armor: 4, speedPct: 5, spMax: 10 },
  'Heavy Leather': { armor: 6, spMax: 20, hpMax: 10 },
  'Chain Mail': { armor: 8, hpMax: 20, speedPct: -5 },
  Plate: { armor: 12, hpMax: 30, speedPct: -10 },
  'Heavy Plate': { armor: 16, hpMax: 40, speedPct: -15 }
};

export const ARMOR_TYPES = Object.keys(ARMOR_TYPE_MODS);

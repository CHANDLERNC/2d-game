export const minions = [];

export function spawnMinion(type, x, y) {
  const m = { type, x, y, hp: 10 };
  minions.push(m);
  return m;
}

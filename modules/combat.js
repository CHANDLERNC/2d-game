/**
 * Combat-related logic.
 * Provides functions for calculating and applying damage.
 */

function clamp(a, b, x) {
  return Math.max(a, Math.min(b, x));
}

export const ARMOR_K_BASE = 50;
export const ARMOR_K_PER_FLOOR = 10;
export const RESIST_CAP = 75;

export function calculateDamage(base, {
  type = 'physical',
  armor = 0,
  floor = 1,
  resFire = 0,
  resIce = 0,
  resShock = 0,
  resMagic = 0,
  resPoison = 0,
  shock = 0,
  armorKBase = ARMOR_K_BASE,
  armorKPerFloor = ARMOR_K_PER_FLOOR,
  resistCap = RESIST_CAP
} = {}) {
  const K = armorKBase + armorKPerFloor * Math.max(0, floor - 1);
  const armorDR = Math.max(0, Math.min(0.8, armor / (armor + K)));
  let afterArmor = base;
  if(type === 'physical' || type === 'ranged') {
    afterArmor = Math.max(1, Math.floor(base * (1 - armorDR)));
  }
  const cap = resistCap;
  const resPct = type === 'fire' ? clamp(0, cap, resFire) :
                 type === 'ice' ? clamp(0, cap, resIce) :
                 type === 'shock' ? clamp(0, cap, resShock) :
                 type === 'magic' ? clamp(0, cap, resMagic) :
                 type === 'poison' ? clamp(0, cap, resPoison) : 0;
  const eff = Math.max(1, Math.floor(afterArmor * (1 - resPct/100) * (1 + shock)));
  return eff;
}

/**
 * Applies damage to the player entity and returns the effective damage.
 * Options should provide hooks for side effects used by the main game.
 */
export function applyDamageToPlayer(player, dmg, {
  type = 'physical',
  floor = 1,
  damageTexts = [],
  getEffectPower = () => 0,
  playHit = () => {},
  showRespawn = () => {},
  armorKBase = ARMOR_K_BASE,
  armorKPerFloor = ARMOR_K_PER_FLOOR,
  resistCap = RESIST_CAP
} = {}) {
  player.combatTimer = 0;
  player.healAcc = 0;
  const shock = getEffectPower(player, 'shock') || 0;
  const eff = calculateDamage(dmg, {
    type,
    armor: player.armor || 0,
    floor,
    resFire: player.resFire || 0,
    resIce: player.resIce || 0,
    resShock: player.resShock || 0,
    resMagic: player.resMagic || 0,
    resPoison: player.resPoison || 0,
    shock,
    armorKBase,
    armorKPerFloor,
    resistCap
  });
  player.hp = Math.max(0, player.hp - eff);
  const dmgCol = type==='magic' ? '#b84aff' :
                 type==='poison'? '#76d38b' : '#ff6b6b';
  damageTexts.push({ tx:player.x, ty:player.y, text:`-${eff}`, color:dmgCol, age:0, ttl:900 });
  playHit();
  if(player.hp === 0) {
    showRespawn();
  }
  return eff;
}

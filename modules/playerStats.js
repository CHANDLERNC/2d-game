// Player statistics such as health, mana and stamina.
class PlayerStats {
  constructor() {
    this.hp = 150;
    this.hpMax = 150;
    this.mp = 60;
    this.mpMax = 60;
    this.sp = 60;
    this.spMax = 60;
    this.baseAtkBonus = 0;
    this.armor = 0;
    this.stealth = 0;
    this.minionDmg = 0;
    this.maxMinions = 0;
  }
}

const stats = new PlayerStats();
export { PlayerStats, stats };

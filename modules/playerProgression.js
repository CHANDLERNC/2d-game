// Player progression such as level and experience.
class PlayerProgression {
  constructor() {
    this.lvl = 1;
    this.xp = 0;
    this.xpToNext = 50;
    this.magicPoints = 0;
    this.skillPoints = 0;
    this.score = 0;
    this.kills = 0;
    this.timeSurvived = 0;
    this.floorsCleared = 0;
    // Run statistics used for random achievements
    this.tilesDiscovered = 0;
    this.miniBossKills = 0;
    this.bossKills = 0;
    this.itemsCollected = 0;
    this.goldCollected = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.spellsCast = 0;
    this.potionsUsed = 0;
    this.distanceTraveled = 0;
    this.class = 'warrior';
    // skill tree will be populated with class-specific structure
    this.skillTree = null;
    this.boundSpell = null;
    this.boundSkill = null;
  }
}

const progression = new PlayerProgression();
export { PlayerProgression, progression };

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
    this.class = 'warrior';
    // skill tree will be populated with class-specific structure
    this.skillTree = null;
    this.boundSpell = null;
    this.boundSkill = null;
  }
}

const progression = new PlayerProgression();
export { PlayerProgression, progression };

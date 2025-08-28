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
    this.magic = { healing:[false,false,false,false,false,false], damage:[false,false,false,false,false,false], dot:[false,false,false,false,false,false] };
    this.skills = { offense:[false,false,false,false,false,false], defense:[false,false,false,false,false,false], techniques:[false,false,false], tricks:[false,false,false] };
    this.boundSpell = null;
    this.boundSkill = null;
  }
}

const progression = new PlayerProgression();
export { PlayerProgression, progression };

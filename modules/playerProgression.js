import { skillTrees } from './skillTrees.js';

// Initialize unlocked skill arrays for a given class
function initSkills(cls){
  const res={};
  const trees=skillTrees[cls];
  for(const key in trees){
    res[key]=new Array(trees[key].abilities.length).fill(false);
  }
  return res;
}

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
    this.skills = initSkills(this.class);
    this.boundSpell = null;
    this.boundSkill = null;
  }
}

const progression = new PlayerProgression();
export { PlayerProgression, progression };

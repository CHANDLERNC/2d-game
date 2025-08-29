// Aggregates player-related modules for convenience.
import { stats } from './playerStats.js';
import { inventory } from './playerInventory.js';
import { progression } from './playerProgression.js';
import { skillTrees } from './skillTrees.js';

const player = {
  x: 0,
  y: 0,
  stepCD: 0,
  stepDelay: 140,
  speedPct: 0,
  atkCD: 0,
  combatTimer: 0,
  healAcc: 0,
  faceDx: 1,
  faceDy: 0,
  effects: []
};

Object.assign(player, stats, inventory, progression);

let playerSpriteKey = 'player_warrior';

function updatePlayerSprite(){
  if(player.class==='mage'){
    let elem='magic';
    if(player.boundSpell){
      const ab=skillTrees.mage[player.boundSpell.tree].abilities[player.boundSpell.idx];
      elem = ab.elem || 'magic';
    }
    const key = elem==='magic' ? 'player_mage' : `player_mage_${elem}`;
    playerSpriteKey = ASSETS.sprites[key] ? key : 'player_mage';
  }else if(player.class==='rogue'){
    playerSpriteKey='player_rogue';
  }else{
    playerSpriteKey='player_warrior';
  }
}

export { player, playerSpriteKey, updatePlayerSprite };
export { stats, inventory, progression };

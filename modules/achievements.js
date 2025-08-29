// Simple achievement generator returning random run statistics.
// Achievements are derived from player progression stats and
// a random subset is returned to display on the score screen.

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

export function generateAchievements(p){
  const stats=[
    {name:'Floors Cleared', value:p.floorsCleared},
    {name:'Enemies Slain', value:p.kills},
    {name:'Tiles Discovered', value:p.tilesDiscovered},
    {name:'Mini-Bosses Defeated', value:p.miniBossKills},
    {name:'Bosses Defeated', value:p.bossKills},
    {name:'Items Collected', value:p.itemsCollected},
    {name:'Gold Collected', value:p.goldCollected},
    {name:'Damage Dealt', value:p.damageDealt},
    {name:'Damage Taken', value:p.damageTaken},
    {name:'Spells Cast', value:p.spellsCast},
    {name:'Potions Used', value:p.potionsUsed},
    {name:'Distance Travelled', value:Math.round(p.distanceTraveled)}
  ];
  // randomize order and select a handful
  const picked=shuffle(stats.slice()).slice(0,5);
  return picked.map(a=>`${a.name}: ${a.value}`);
}

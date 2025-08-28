// Map data and helpers

const TILE=32, MAP_W=48, MAP_H=48;
const T_EMPTY=0, T_FLOOR=1, T_WALL=2, T_TRAP=3, T_LAVA=4;
const TRAP_CHANCE=0.01, LAVA_CHANCE=0.02;

let map=[], fog=[], vis=[]; let rooms=[]; let stairs={x:0,y:0};
let merchant={x:0,y:0}; let merchantStyle = Math.random()<0.5 ? 'goblin' : 'stall';
let torches=[]; let lavaTiles=[]; let spikeTraps=[];

function walkable(x,y){
  if(x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
  const t=map[y*MAP_W+x];
  return t!==T_WALL && t!==T_EMPTY;
}

function canMoveFrom(x,y,dx,dy){
  const nx=x+dx, ny=y+dy;
  if(!walkable(nx,ny)) return false;
  if(dx!==0 && dy!==0){ if(!walkable(x+dx,y) && !walkable(x,y+dy)) return false; }
  return true;
}

// reset map-related arrays without changing their references
function resetMapState(){
  map.length = MAP_W * MAP_H; map.fill(T_EMPTY);
  fog.length = MAP_W * MAP_H; fog.fill(0);
  vis.length = MAP_W * MAP_H; vis.fill(0);
  rooms.length = 0;
  torches.length = 0;
  lavaTiles.length = 0;
  spikeTraps.length = 0;
}

export {
  TILE, MAP_W, MAP_H,
  T_EMPTY, T_FLOOR, T_WALL, T_TRAP, T_LAVA,
  TRAP_CHANCE, LAVA_CHANCE,
  map, fog, vis, rooms, stairs, merchant, merchantStyle,
  torches, lavaTiles, spikeTraps,
  walkable, canMoveFrom,
  resetMapState
};

// Map data and helpers

import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TRAP_CHANCE as TRAP_CHANCE_CFG,
  LAVA_CHANCE as LAVA_CHANCE_CFG
} from './config.js';

const TILE = TILE_SIZE;
const MAP_W = MAP_WIDTH;
const MAP_H = MAP_HEIGHT;
const T_EMPTY=0, T_FLOOR=1, T_WALL=2, T_TRAP=3, T_LAVA=4;
const TRAP_CHANCE = TRAP_CHANCE_CFG;
const LAVA_CHANCE = LAVA_CHANCE_CFG;

const B_DESERT = 0, B_FOREST = 1, B_MOUNTAIN = 2;

let map=[], fog=[], vis=[]; let rooms=[]; let stairs={x:0,y:0};
let merchant={x:0,y:0}; let merchantStyle = Math.random()<0.5 ? 'goblin' : 'stall';
let torches=[]; let lavaTiles=[]; let spikeTraps=[]; let biomeMap=[];

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
  biomeMap.length = MAP_W * MAP_H; biomeMap.fill(B_FOREST);
}

export {
  TILE, MAP_W, MAP_H,
  T_EMPTY, T_FLOOR, T_WALL, T_TRAP, T_LAVA,
  TRAP_CHANCE, LAVA_CHANCE,
  map, fog, vis, rooms, stairs, merchant, merchantStyle,
  torches, lavaTiles, spikeTraps, biomeMap,
  B_DESERT, B_FOREST, B_MOUNTAIN,
  walkable, canMoveFrom,
  resetMapState
};

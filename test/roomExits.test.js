import { strict as assert } from 'assert';
import { map, rooms, MAP_W, MAP_H, T_FLOOR, resetMapState } from '../modules/map.js';
import { connectRooms } from '../modules/mapGen.js';

class RNG {
  constructor(seed=1){ this.s=seed; }
  next(){ this.s=(this.s*1664525+1013904223)|0; return (this.s>>>0)/4294967296; }
  int(a,b){ return Math.floor(a + (b-a+1)*this.next()); }
}

function addRoom(x,y,w,h){
  rooms.push({x,y,w,h});
  for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++) map[yy*MAP_W+xx]=T_FLOOR;
}

function countExits(r){
  const cx=r.x+((r.w/2)|0);
  const cy=r.y+((r.h/2)|0);
  let exits=0;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    let x=cx, y=cy;
    while(x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h){
      x+=dx; y+=dy;
    }
    if(x<0||y<0||x>=MAP_W||y>=MAP_H) continue;
    if(map[y*MAP_W+x]===T_FLOOR) exits++;
  }
  return exits;
}

resetMapState();
addRoom(2,2,4,4);
addRoom(12,2,4,4);
addRoom(2,12,4,4);
addRoom(12,12,4,4);

const rng=new RNG(123);
connectRooms(rng, 0);

for(const r of rooms){
  assert.ok(countExits(r) >= 2, 'room should have at least two exits');
}

resetMapState();

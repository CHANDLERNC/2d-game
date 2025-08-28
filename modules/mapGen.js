import { map, rooms, T_FLOOR, T_WALL, MAP_W, MAP_H } from './map.js';

const MIN_ROOM_SIZE = 2;

function connectRooms(){
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1], b=rooms[i];
    const ax=a.x+((a.w/2)|0), ay=a.y+((a.h/2)|0);
    const bx=b.x+((b.w/2)|0), by=b.y+((b.h/2)|0);
    for(let x=Math.min(ax,bx); x<=Math.max(ax,bx); x++) map[ay*MAP_W+x]=T_FLOOR;
    for(let y=Math.min(ay,by); y<=Math.max(ay,by); y++) map[y*MAP_W+bx]=T_FLOOR;
  }
}

function pruneSmallAreas(){
  const visited=new Set();
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const idx=y*MAP_W+x;
      if(map[idx]!==T_FLOOR || visited.has(idx)) continue;
      const stack=[[x,y]]; const tiles=[]; visited.add(idx);
      let minX=x, maxX=x, minY=y, maxY=y;
      while(stack.length){
        const [cx,cy]=stack.pop(); tiles.push([cx,cy]);
        if(cx<minX) minX=cx; if(cx>maxX) maxX=cx;
        if(cy<minY) minY=cy; if(cy>maxY) maxY=cy;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H) continue;
          const nIdx=ny*MAP_W+nx; if(map[nIdx]!==T_FLOOR || visited.has(nIdx)) continue;
          visited.add(nIdx); stack.push([nx,ny]);
        }
      }
      const width=maxX-minX+1, height=maxY-minY+1;
      if(width<MIN_ROOM_SIZE || height<MIN_ROOM_SIZE){
        for(const [tx,ty] of tiles) map[ty*MAP_W+tx]=T_WALL;
      }
    }
  }
}

export { MIN_ROOM_SIZE, connectRooms, pruneSmallAreas };

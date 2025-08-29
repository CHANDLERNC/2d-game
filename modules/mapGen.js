import { map, rooms, T_FLOOR, T_WALL, MAP_W, MAP_H } from './map.js';

const MIN_ROOM_SIZE = 2;

function carveHallway(rng, ax, ay, bx, by){
  // Randomly choose whether to carve horizontally then vertically or vice versa
  if(rng.next() < 0.5){
    for(let x=Math.min(ax,bx); x<=Math.max(ax,bx); x++) map[ay*MAP_W+x]=T_FLOOR;
    for(let y=Math.min(ay,by); y<=Math.max(ay,by); y++) map[y*MAP_W+bx]=T_FLOOR;
  } else {
    for(let y=Math.min(ay,by); y<=Math.max(ay,by); y++) map[y*MAP_W+ax]=T_FLOOR;
    for(let x=Math.min(ax,bx); x<=Math.max(ax,bx); x++) map[by*MAP_W+x]=T_FLOOR;
  }
}

function connectRooms(rng, extra=1){
  if(rooms.length < 2) return;

  const centers = rooms.map(r=>({
    x: r.x + ((r.w/2)|0),
    y: r.y + ((r.h/2)|0)
  }));

  const connected = new Set([0]);
  while(connected.size < centers.length){
    let bestA=-1,bestB=-1,bestDist=Infinity;
    for(const a of connected){
      for(let b=0;b<centers.length;b++){
        if(connected.has(b)) continue;
        const ca=centers[a], cb=centers[b];
        const d=Math.abs(ca.x-cb.x)+Math.abs(ca.y-cb.y);
        if(d<bestDist){ bestDist=d; bestA=a; bestB=b; }
      }
    }
    const a=centers[bestA], b=centers[bestB];
    carveHallway(rng, a.x,a.y,b.x,b.y);
    connected.add(bestB);
  }

  // add some extra random connections for loops
  for(let i=0;i<extra;i++){
    const a=rng.int(0, centers.length-1);
    let b=rng.int(0, centers.length-1);
    if(a===b) b=(b+1)%centers.length;
    carveHallway(rng, centers[a].x, centers[a].y, centers[b].x, centers[b].y);
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

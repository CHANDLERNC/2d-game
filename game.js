import { initAudio, playFootstep, playAttack, playHit, playCalmMusic, playCombatMusic, playBossMusic } from './modules/audio.js';
import { keys, initInput } from './modules/input.js';
import { player, playerSpriteKey, magicTrees, skillTrees, updatePlayerSprite } from './modules/player.js';
import { inventory, SLOTS, BAG_SIZE, POTION_BAG_SIZE } from './modules/playerInventory.js';
import { hpFill, mpFill, hpLbl, mpLbl, hudFloor, hudSeed, hudGold, hudDmg, hudScore, hudKills, xpFill, xpLbl, hudLvl, hudSpell, hudAbilityLabel, updateResourceUI, updateXPUI, updateScoreUI, toggleActionLog, showToast, showBossAlert, showRespawn } from './modules/ui.js';
import { TILE, MAP_W, MAP_H, T_EMPTY, T_FLOOR, T_WALL, T_TRAP, T_LAVA, TRAP_CHANCE, LAVA_CHANCE, map, fog, vis, rooms, stairs, merchant, merchantStyle, torches, lavaTiles, spikeTraps, walkable, canMoveFrom, resetMapState } from './modules/map.js';
import { MONSTER_BASE_COUNT, MONSTER_MIN_COUNT, MONSTER_COUNT_GROWTH, MONSTER_COUNT_VARIANCE, FOV_RADIUS, LOOT_CHANCE, MONSTER_LOOT_CHANCE, AGGRO_RANGE, TORCH_CHANCE, TORCH_LIGHT_RADIUS, FOV_RAYS, SCORE_PER_SECOND, OUT_OF_COMBAT_HEAL_DELAY, OUT_OF_COMBAT_HEAL_RATE, OUT_OF_COMBAT_MANA_RATE, OUT_OF_COMBAT_STAM_RATE, SCORE_PER_KILL, SCORE_PER_FLOOR_CLEAR, SCORE_PER_FLOOR_REACHED, BOSS_VARIANTS, XP_GAIN_MULT, ENEMY_SPEED_MULT, MONSTER_HP_MULT, MONSTER_DMG_MULT } from './modules/config.js';
import { startLoop } from './modules/loop.js';
import { applyDamageToPlayer as coreApplyDamageToPlayer } from './modules/combat.js';
import { renderLayers } from './modules/rendering.js';
import { MIN_ROOM_SIZE, connectRooms, pruneSmallAreas } from './modules/mapGen.js';

// ===== Config / Globals =====
let VIEW_W=window.innerWidth, VIEW_H=window.innerHeight;
function randomBossVariant(){ return BOSS_VARIANTS[rng.int(0,BOSS_VARIANTS.length-1)]; }
function monsterCountForFloor(floor){
  const base = MONSTER_BASE_COUNT + (floor-1)*MONSTER_COUNT_GROWTH;
  const extra = rng.int(0, MONSTER_COUNT_VARIANCE + Math.floor(floor/2));
  return Math.max(MONSTER_MIN_COUNT, base + extra);
}
// Cap applied to resistance calculations (percentage)
const RESIST_CAP = 75;
let canvas=document.getElementById('gameCanvas'); let ctx=canvas.getContext('2d');
let mouseX=0, mouseY=0;
canvas.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); mouseX=e.clientX-r.left; mouseY=e.clientY-r.top; });
function resizeCanvas(){ canvas.width = VIEW_W = window.innerWidth; canvas.height = VIEW_H = window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();
let camX=0, camY=0; let floorLayer=null, wallLayer=null;
let zoom=1;
let floorTint='#ffffff', wallTint='#ffffff';
let gameOver=false;
let paused=false;
let scoreUpdateTimer=0;

let seed=(Math.random()*1e9)|0, floorNum=1, rng=new RNG(seed);

// Monsters now have richer AI with per-type patterns and scaling
// {x,y,rx,ry,type,hp,hpMax,dmgMin,dmgMax,atkCD,moveCD,xp,state:{...},hitFlash,effects:[]}
let monsters=[];
// Simple projectile pool for ranged/magic attacks
// {x,y,dx,dy,speed,damage,type,elem,owner,alive,maxDist,dist,ls,status}
let projectiles=[];
// floating combat text
let damageTexts=[];
function addDamageText(tx,ty,text,color){ damageTexts.push({ tx, ty, text, color, age:0, ttl:800 }); }
let currentStats={dmgMin:0,dmgMax:0,crit:0,armor:0,resF:0,resI:0,resS:0,resM:0,resP:0,hpMax:0,mpMax:0,spMax:0};


// --- Smooth helpers & settings ---
function smoothstep01(t){ return t*t*(3-2*t); }
function lerp(a,b,t){ return a + (b-a)*t; }
let smoothEnabled = true; let baseStepDelay = 140; // sync to player.stepDelay on start

// ===== RNG =====
function RNG(seed){ this.s=seed|0; }
RNG.prototype.next=function(){ this.s=(this.s*1664525+1013904223)|0; return ((this.s>>>0)/4294967296); }
RNG.prototype.int=function(a,b){ return Math.floor(a + (b-a+1)*this.next()); }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=rng.int(0,i);
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// ===== Map / Gen =====

function generateRooms(){
  rooms.length = 0;
  map.fill(T_EMPTY);
  // rooms
  for(let i=0;i<28;i++){
    const w=rng.int(MIN_ROOM_SIZE,11), h=rng.int(MIN_ROOM_SIZE,11);
    const x=rng.int(1,MAP_W-w-1), y=rng.int(1,MAP_H-h-1);
    rooms.push({x,y,w,h});
    for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++) map[yy*MAP_W+xx]=T_FLOOR;
  }
  connectRooms();
  // ensure connectivity by removing unreachable floors
  if(rooms.length){
    const start=rooms[0];
    const sx=start.x+((start.w/2)|0), sy=start.y+((start.h/2)|0);
    const q=[[sx,sy]];
    const seen=new Set([sy*MAP_W+sx]);
    while(q.length){
      const [x,y]=q.pop();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H) continue;
        const idx=ny*MAP_W+nx; if(map[idx]!==T_FLOOR || seen.has(idx)) continue;
        seen.add(idx); q.push([nx,ny]);
      }
    }
    for(let i=0;i<map.length;i++) if(map[i]===T_FLOOR && !seen.has(i)) map[i]=T_WALL;
    const filtered = rooms.filter(r=>{
      const cx=r.x+((r.w/2)|0), cy=r.y+((r.h/2)|0);
      return seen.has(cy*MAP_W+cx);
    });
    rooms.length = 0;
    rooms.push(...filtered);
  }
  pruneSmallAreas();
  // walls
  for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) if(map[y*MAP_W+x]===T_FLOOR){ for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+d[0], ny=y+d[1]; if(nx>=0&&ny>=0&&nx<MAP_W&&ny<MAP_H && map[ny*MAP_W+nx]===T_EMPTY) map[ny*MAP_W+nx]=T_WALL; } }
  // torches along walls facing floors
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(map[y*MAP_W+x]!==T_WALL) continue;
    let adj=false;
    for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+d[0], ny=y+d[1];
      if(map[ny*MAP_W+nx]===T_FLOOR){ adj=true; break; }
    }
    if(adj && rng.next()<TORCH_CHANCE){ torches.push({x,y,phase:rng.next()*Math.PI*2}); }
  }
  // place player + stairs + merchant
  const r=rooms[rng.int(0,rooms.length-1)]; player.x=r.x+((r.w/2)|0); player.y=r.y+((r.h/2)|0);
  let rr=rooms[rng.int(0,rooms.length-1)]; stairs.x=rr.x+((rr.w/2)|0); stairs.y=rr.y+((rr.h/2)|0);
  let rm=rooms[rng.int(0,rooms.length-1)];
  merchant.x=rm.x+((rm.w/2)|0); merchant.y=rm.y+((rm.h/2)|0);
  while((merchant.x===player.x && merchant.y===player.y) || (merchant.x===stairs.x && merchant.y===stairs.y)){
    merchant.x=rng.int(rm.x+1,rm.x+rm.w-2);
    merchant.y=rng.int(rm.y+1,rm.y+rm.h-2);
  }

  // monsters
  const spawnCount = monsterCountForFloor(floorNum);
  for(let i=0;i<spawnCount;i++){
    let placed=false, tries=0;
    while(!placed && tries<25){
      const r=rooms[rng.int(0,rooms.length-1)];
      const x=rng.int(r.x+1,r.x+r.w-2), y=rng.int(r.y+1,r.y+r.h-2);
      if((x===player.x && y===player.y) || (x===merchant.x && y===merchant.y)){
        tries++; continue;
      }
      if(monsters.some(m=>Math.abs(m.x-x)+Math.abs(m.y-y)<4)){
        tries++; continue;
      }
      const t = chooseMonsterType(floorNum);
      monsters.push(spawnMonster(t,x,y, shouldSpawnElite(floorNum)));
      placed=true;
    }
  }

  // ensure at least one mage spawns on higher floors
  if(floorNum > 4 && !monsters.some(m=>m.type===3)){
    let placed=false, tries=0;
    while(!placed && tries<25){
      const r=rooms[rng.int(0,rooms.length-1)];
      const x=rng.int(r.x+1,r.x+r.w-2), y=rng.int(r.y+1,r.y+r.h-2);
      if((x===player.x && y===player.y) || (x===merchant.x && y===merchant.y)){
        tries++; continue;
      }
      if(monsters.some(m=>Math.abs(m.x-x)+Math.abs(m.y-y)<4)){
        tries++; continue;
      }
      monsters.push(spawnMonster(3,x,y, shouldSpawnElite(floorNum)));
      placed=true;
    }
  }

  // determine strongest monster to scale bosses from
  let strongest = null;
  for(const m of monsters){ if(!strongest || m.hpMax > strongest.hpMax) strongest = m; }
  if(strongest){
    // spawn mini boss with 1.8x HP of strongest mob
    let placed=false, tries=0;
    while(!placed && tries<50){
      const r=rooms[rng.int(0,rooms.length-1)];
      const x=rng.int(r.x+1,r.x+r.w-2), y=rng.int(r.y+1,r.y+r.h-2);
      if((x===player.x && y===player.y) || (x===merchant.x && y===merchant.y)){
        tries++; continue;
      }
      if(monsters.some(m=>Math.abs(m.x-x)+Math.abs(m.y-y)<4)){
        tries++; continue;
      }
      const mb=spawnMonster(strongest.type,x,y);
      mb.hpMax = mb.hp = Math.round(strongest.hpMax * 1.8);
      mb.miniBoss = true;
      mb.spriteKey = randomBossVariant();
      mb.spriteSize = 48;
      monsters.push(mb);
      placed=true;
    }

    // every 5 floors spawn an extra large boss
    if(floorNum % 5 === 0){
      placed=false; tries=0;
      const hpMult = 2.5 + rng.next()*0.5; // 2.5-3x
      while(!placed && tries<50){
        const r=rooms[rng.int(0,rooms.length-1)];
        const x=rng.int(r.x+1,r.x+r.w-2), y=rng.int(r.y+1,r.y+r.h-2);
        if((x===player.x && y===player.y) || (x===merchant.x && y===merchant.y)){
          tries++; continue;
        }
        if(monsters.some(m=>Math.abs(m.x-x)+Math.abs(m.y-y)<4)){
          tries++; continue;
        }
        const bb=spawnMonster(strongest.type,x,y);
        bb.hpMax = bb.hp = Math.round(strongest.hpMax * hpMult);
        bb.dmgMin = Math.round(bb.dmgMin * 2);
        bb.dmgMax = Math.round(bb.dmgMax * 2);
        bb.bigBoss = true;
        bb.spriteKey = randomBossVariant();
        bb.spriteSize = 48;
        monsters.push(bb);
        placed=true;
      }
      showBossAlert();
    }
  }
}

function generateCave(){
  // random initial map
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const idx=y*MAP_W+x;
      if(x===0||y===0||x===MAP_W-1||y===MAP_H-1) map[idx]=T_WALL;
      else map[idx]=rng.next()<0.45?T_FLOOR:T_WALL;
    }
  }
  // cellular automata smoothing
  for(let iter=0; iter<4; iter++){
    const next=map.slice();
    for(let y=1;y<MAP_H-1;y++){
      for(let x=1;x<MAP_W-1;x++){
        let cnt=0;
        for(let yy=-1;yy<=1;yy++) for(let xx=-1;xx<=1;xx++) if(!(xx===0&&yy===0) && map[(y+yy)*MAP_W+(x+xx)]===T_FLOOR) cnt++;
        const idx=y*MAP_W+x;
        if(map[idx]===T_FLOOR) next[idx]=cnt>=4?T_FLOOR:T_WALL;
        else next[idx]=cnt>=5?T_FLOOR:T_WALL;
      }
    }
    for(let i=0;i<map.length;i++) map[i]=next[i];
  }
  // connectivity
  let startIdx=map.findIndex(t=>t===T_FLOOR);
  if(startIdx!==-1){
    const q=[[startIdx%MAP_W, Math.floor(startIdx/MAP_W)]];
    const seen=new Set([startIdx]);
    while(q.length){
      const [x,y]=q.pop();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H) continue;
        const i=ny*MAP_W+nx; if(map[i]!==T_FLOOR || seen.has(i)) continue; seen.add(i); q.push([nx,ny]);
      }
    }
    for(let i=0;i<map.length;i++) if(map[i]===T_FLOOR && !seen.has(i)) map[i]=T_WALL;
  }
  // secret rooms
  for(let s=0;s<3;s++){
    const baseX=rng.int(2,MAP_W-3), baseY=rng.int(2,MAP_H-3);
    if(map[baseY*MAP_W+baseX]!==T_FLOOR) continue;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    const dir=dirs[rng.int(0,dirs.length-1)];
    const wx=baseX+dir[0], wy=baseY+dir[1];
    const rx=wx+dir[0], ry=wy+dir[1];
    const rw=rng.int(3,5), rh=rng.int(3,5);
    if(rx<1||ry<1||rx+rw>=MAP_W-1||ry+rh>=MAP_H-1) continue;
    map[wy*MAP_W+wx]=T_FLOOR;
    for(let yy=ry; yy<ry+rh; yy++) for(let xx=rx; xx<rx+rw; xx++) map[yy*MAP_W+xx]=T_FLOOR;
  }
  // torches
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++){
    if(map[y*MAP_W+x]!==T_WALL) continue;
    let adj=false;
    for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+d[0], ny=y+d[1]; if(map[ny*MAP_W+nx]===T_FLOOR){ adj=true; break; }
    }
    if(adj && rng.next()<TORCH_CHANCE){ torches.push({x,y,phase:rng.next()*Math.PI*2}); }
  }
  // collect floor tiles
  const tiles=[];
  for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++) if(map[y*MAP_W+x]===T_FLOOR) tiles.push({x,y});
  function pick(){ return tiles[rng.int(0,tiles.length-1)]; }
  const p=pick(); player.x=p.x; player.y=p.y;
  let s=pick(); stairs.x=s.x; stairs.y=s.y;
  let m=pick(); merchant.x=m.x; merchant.y=m.y;
  while((merchant.x===player.x && merchant.y===player.y) || (merchant.x===stairs.x && merchant.y===stairs.y)){
    m=pick(); merchant.x=m.x; merchant.y=m.y;
  }
  const spawnCount = monsterCountForFloor(floorNum);
  for(let i=0;i<spawnCount;i++){
    let placed=false, tries=0;
    while(!placed && tries<25){
      const t=pick(); const x=t.x, y=t.y;
      if(Math.abs(x-player.x)+Math.abs(y-player.y)<2 || (x===merchant.x && y===merchant.y) || (x===stairs.x && y===stairs.y)){ tries++; continue; }
      if(monsters.some(mo=>Math.abs(mo.x-x)+Math.abs(mo.y-y)<4)){ tries++; continue; }
      const tt = chooseMonsterType(floorNum);
      monsters.push(spawnMonster(tt,x,y, shouldSpawnElite(floorNum))); placed=true;
    }
  }
  if(floorNum>4 && !monsters.some(m=>m.type===3)){
    let placed=false, tries=0;
    while(!placed && tries<25){
      const t=pick(); const x=t.x, y=t.y;
      if(Math.abs(x-player.x)+Math.abs(y-player.y)<2 || (x===merchant.x && y===merchant.y) || (x===stairs.x && y===stairs.y)){ tries++; continue; }
      if(monsters.some(mo=>Math.abs(mo.x-x)+Math.abs(mo.y-y)<4)){ tries++; continue; }
      monsters.push(spawnMonster(3,x,y, shouldSpawnElite(floorNum))); placed=true;
    }
  }
  let strongest=null;
  for(const m of monsters){ if(!strongest || m.hpMax>strongest.hpMax) strongest=m; }
  if(strongest){
    let placed=false, tries=0;
    while(!placed && tries<50){
      const t=pick(); const x=t.x, y=t.y;
      if(Math.abs(x-player.x)+Math.abs(y-player.y)<2 || (x===merchant.x && y===merchant.y) || (x===stairs.x && y===stairs.y)){ tries++; continue; }
      if(monsters.some(mo=>Math.abs(mo.x-x)+Math.abs(mo.y-y)<4)){ tries++; continue; }
      const mb=spawnMonster(strongest.type,x,y);
      mb.hpMax = mb.hp = Math.round(strongest.hpMax*1.8);
      mb.miniBoss=true; mb.spriteKey=randomBossVariant(); mb.spriteSize=48; monsters.push(mb); placed=true;
    }
    if(floorNum%5===0){
      placed=false; tries=0; const hpMult=2.5 + rng.next()*0.5;
      while(!placed && tries<50){
        const t=pick(); const x=t.x, y=t.y;
        if(Math.abs(x-player.x)+Math.abs(y-player.y)<2 || (x===merchant.x && y===merchant.y) || (x===stairs.x && y===stairs.y)){ tries++; continue; }
        if(monsters.some(mo=>Math.abs(mo.x-x)+Math.abs(mo.y-y)<4)){ tries++; continue; }
        const bb=spawnMonster(strongest.type,x,y);
        bb.hpMax = bb.hp = Math.round(strongest.hpMax*hpMult);
        bb.dmgMin = Math.round(bb.dmgMin*2); bb.dmgMax = Math.round(bb.dmgMax*2);
        bb.bigBoss=true; bb.spriteKey=randomBossVariant(); bb.spriteSize=48; monsters.push(bb); placed=true;
      }
      showBossAlert();
    }
  }
}

function placeHazards(){
  for(let y=1;y<MAP_H-1;y++){
    for(let x=1;x<MAP_W-1;x++){
      const idx=y*MAP_W+x;
      if(map[idx]!==T_FLOOR) continue;
      if((x===player.x && y===player.y) || (x===stairs.x && y===stairs.y) || (x===merchant.x && y===merchant.y)) continue;
      if(monsters.some(m=>m.x===x && m.y===y)) continue;
      const r=rng.next();
      if(r<LAVA_CHANCE){
        map[idx]=T_LAVA;
        lavaTiles.push({x,y});
      } else if(r<LAVA_CHANCE+TRAP_CHANCE){
        map[idx]=T_TRAP;
        spikeTraps.push({x,y});
      }
    }
  }
}

function checkHazard(x,y){
  const t=map[y*MAP_W+x];
  if(t===T_TRAP){
    applyDamageToPlayer(20);
    addDamageText(x,y,'Trap!','#f55');
  } else if(t===T_LAVA){
    applyDamageToPlayer(8,'fire');
    addDamageText(x,y,'Lava!','#f80');
  }
}

function generate(){
  resetMapState();
  monsters=[]; projectiles=[]; lootMap.clear(); player.effects = [];
  const hue=rng.int(0,360);
  const sat=8+rng.int(0,8);
  const baseLight=35+rng.int(-5,5);
  const light=Math.min(100,Math.round(baseLight*1.1));
  floorTint=`hsl(${hue}, ${sat}%, ${light}%)`;
  const wallHue=(hue + rng.int(-20,20) + 360)%360;
  const wallLight=Math.max(10, light-5);
  wallTint=`hsl(${wallHue}, ${sat}%, ${wallLight}%)`;
  if(rng.next()<0.5) generateCave(); else generateRooms();
  placeHazards();
  buildLayers();
  recomputeFOV();
  seedRoomLoot();
  genShopStock();
  redrawInventory();
  renderShop();
  playCalmMusic();
}

// ===== Difficulty scaling & Monster factory =====
const SCALE = { HP_PER_FLOOR: 6, DMG_PER_FLOOR: 1, HARDNESS_MULT: 0.15, RES_PER_FLOOR: 0.5, RES_MAGIC_PER_FLOOR: 0.3 };
function scaleStat(base, perFloor){ return Math.max(1, Math.floor(base + perFloor * Math.max(0, floorNum-1))); }

function chooseMonsterType(floor){
  const pool = [
    {type:0, w:3}, // slimes always
    {type:1, w:2}, // bats always
  ];
  if(floor>=2) pool.push({type:5, w:2}); // goblins
  if(floor>=3) pool.push({type:2, w:2}); // skeletons
  if(floor>=4) pool.push({type:6, w:1}); // ghosts
  if(floor>=5) pool.push({type:3, w:1}); // mages
  // weight tough enemies if player overpowered
  const power = player.lvl + (player.dmgMin + player.dmgMax)/4;
  if(power > floor*2){
    for(const opt of pool){ if(opt.type>=2) opt.w += 2; }
  }
  const total = pool.reduce((s,o)=>s+o.w,0);
  let r = rng.next()*total;
  for(const opt of pool){ r -= opt.w; if(r<=0) return opt.type; }
  return 0;
}
function shouldSpawnElite(floor){
  const chance = 0.05 + floor*0.02;
  return rng.next() < Math.min(0.25, chance);
}

function spawnMonster(type,x,y,elite=false){
  // Base stats per archetype
  const archetypes = [
    { hp:18, dmg:[2,4], atkCD:28, moveCD:[6,10] },    // slime base
    { hp:6,  dmg:[1,3], atkCD:22, moveCD:[4,8] },     // bat: frail but fast
    { hp:14, dmg:[2,5], atkCD:38, moveCD:[6,10] },    // skeleton: durable ranged
    { hp:11, dmg:[3,7], atkCD:39, moveCD:[6,10] },    // mage: higher damage, slower attack
    { hp:12, dmg:[3,6], atkCD:30, moveCD:[6,10] },    // dragon hatchling
    { hp:10, dmg:[2,5], atkCD:26, moveCD:[5,9] },     // goblin: agile melee
    { hp:8,  dmg:[1,4], atkCD:32, moveCD:[6,12] },    // ghost: drifting foe
  ];
  let a = archetypes[type] || archetypes[0];
  let spriteKey;
  if(type===0){ // slime variants
    const vars = [
      {key:'slime', hp:18, dmg:[2,4], atkCD:28, moveCD:[6,10]},
      {key:'slime_red', hp:16, dmg:[3,6], atkCD:28, moveCD:[6,10]},
      {key:'slime_yellow', hp:24, dmg:[2,5], atkCD:32, moveCD:[8,12]},
      {key:'slime_blue', hp:20, dmg:[2,5], atkCD:28, moveCD:[6,10]},
      {key:'slime_purple', hp:22, dmg:[3,5], atkCD:30, moveCD:[6,10]},
      {key:'slime_shadow', hp:18, dmg:[4,7], atkCD:35, moveCD:[6,10]},
    ];
    const v = vars[rng.int(0, vars.length-1)];
    a = {hp:v.hp, dmg:v.dmg, atkCD:v.atkCD, moveCD:v.moveCD};
    spriteKey = v.key;
  } else if(type===1){ // bat variants
    const vars = ['bat','bat_brown'];
    spriteKey = vars[rng.int(0, vars.length-1)];
  } else if(type===2){ // skeleton variants
    const vars = ['skeleton','skeleton_red','skeleton_green'];
    spriteKey = vars[rng.int(0, vars.length-1)];
  } else if(type===3){ // mage variants
    const vars = ['mage','mage_red','mage_green'];
    spriteKey = vars[rng.int(0, vars.length-1)];
  } else if(type===4){ // dragon hatchling
    spriteKey = 'dragon_hatchling';
  } else if(type===5){ // goblin
    spriteKey = 'goblin';
  } else if(type===6){ // ghost
    spriteKey = 'ghost';
  }
  const diff = 1 + SCALE.HARDNESS_MULT * Math.max(0, floorNum-1);
  const m = {
    x, y, rx:x, ry:y, type,
    hpMax: Math.round(scaleStat(a.hp * MONSTER_HP_MULT, SCALE.HP_PER_FLOOR) * diff),
    hp: 0,
    dmgMin: Math.round(scaleStat(a.dmg[0] * MONSTER_DMG_MULT, SCALE.DMG_PER_FLOOR) * diff),
    dmgMax: Math.round(scaleStat(a.dmg[1] * MONSTER_DMG_MULT, SCALE.DMG_PER_FLOOR) * diff),
    atkCD: rng.int(10, a.atkCD), // frames
    moveCD: Math.round(rng.int(a.moveCD[0], a.moveCD[1]) * ENEMY_SPEED_MULT),
    xp: 0,
    state: {}, aggroT:0, hitFlash:0, moving:false, moveT:1, moveDur: Math.round(140 * ENEMY_SPEED_MULT), fromX:x, fromY:y, toX:x, toY:y, effects:[],
    elite
  };
  if(elite){
    m.hpMax = Math.round(m.hpMax * 1.5);
    m.dmgMin = Math.round(m.dmgMin * 1.3);
    m.dmgMax = Math.round(m.dmgMax * 1.3);
    m.atkCD = Math.max(6, Math.round(m.atkCD * 0.8));
    m.moveCD = Math.max(2, Math.round(m.moveCD * 0.8));
  }
  m.hp = m.hpMax;
  m.xp = calcMonsterXP(m);
  const elemRes = Math.floor(SCALE.RES_PER_FLOOR * Math.max(0, floorNum-1));
  const magicRes = Math.floor(SCALE.RES_MAGIC_PER_FLOOR * Math.max(0, floorNum-1));
  m.resFire = elemRes;
  m.resIce = elemRes;
  m.resShock = elemRes;
  m.resPoison = elemRes;
  m.resMagic = magicRes;
  if(spriteKey) m.spriteKey = spriteKey;
  return m;
}

// Helpers
function sign(n){ return n===0?0:(n>0?1:-1); }
function clearPathCardinal(x1,y1,x2,y2){
  if(x1!==x2 && y1!==y2) return false;
  const dx=sign(x2-x1), dy=sign(y2-y1);
  let x=x1+dx, y=y1+dy;
  while(!(x===x2 && y===y2)){
    if(isBlock(x,y)) return false;
    x+=dx; y+=dy;
  }
  return true;
}
// 8-directional LoS (grid step); simple check for caster
function clearPath8(x1,y1,x2,y2){
  let dx = sign(x2-x1), dy = sign(y2-y1);
  if(dx===0 && dy===0) return true;
  let x=x1+dx, y=y1+dy;
  while(!(x===x2 && y===y2)){
    if(isBlock(x,y)) return false;
    if(x!==x2) x+=dx;
    if(y!==y2) y+=dy;
  }
  return true;
}

function buildLayers(){
  floorLayer=document.createElement('canvas'); floorLayer.width=MAP_W*TILE; floorLayer.height=MAP_H*TILE;
  wallLayer=document.createElement('canvas'); wallLayer.width=MAP_W*TILE; wallLayer.height=MAP_H*TILE;
  const f=floorLayer.getContext('2d'), w=wallLayer.getContext('2d');
  f.fillStyle=f.createPattern(ASSETS.textures.floor,'repeat'); f.fillRect(0,0,floorLayer.width,floorLayer.height);
  // mask non-floor
  const mask=document.createElement('canvas'); mask.width=floorLayer.width; mask.height=floorLayer.height;
  const mg=mask.getContext('2d'); mg.fillStyle='#000'; mg.fillRect(0,0,mask.width,mask.height);
  mg.globalCompositeOperation='destination-out';
  mg.fillStyle='#fff';
  for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) if(map[y*MAP_W+x]===T_FLOOR||map[y*MAP_W+x]===T_TRAP||map[y*MAP_W+x]===T_LAVA){ mg.fillRect(x*TILE,y*TILE,TILE,TILE); }
  f.drawImage(mask,0,0);
  f.globalCompositeOperation='multiply';
  f.fillStyle=floorTint;
  f.fillRect(0,0,floorLayer.width,floorLayer.height);
  f.globalCompositeOperation='source-over';
  // walls
  w.fillStyle=w.createPattern(ASSETS.textures.wall,'repeat');
  for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) if(map[y*MAP_W+x]===T_WALL) w.fillRect(x*TILE,y*TILE,TILE,TILE);
  w.globalCompositeOperation='multiply';
  w.fillStyle=wallTint;
  w.fillRect(0,0,wallLayer.width,wallLayer.height);
  w.globalCompositeOperation='source-over';
}

// ===== FOV =====
function isBlock(x,y){
  if(x<0||y<0||x>=MAP_W||y>=MAP_H) return true;
  return map[y*MAP_W+x]===T_WALL || map[y*MAP_W+x]===T_EMPTY;
}

function castLightFrom(sx, sy, radius){
  for(let a=0; a<FOV_RAYS; a++){
    const ang = a*Math.PI*2/FOV_RAYS;
    let x=sx+0.5, y=sy+0.5;
    for(let r=0; r<radius*2; r++){
      const ix=x|0, iy=y|0;
      if(ix<0||iy<0||ix>=MAP_W||iy>=MAP_H) break;
      const idx=iy*MAP_W+ix;
      vis[idx]=1; fog[idx]=Math.max(fog[idx],1);
      if(isBlock(ix,iy) && !(ix===sx && iy===sy)) break;
      x+=Math.cos(ang)*0.5; y+=Math.sin(ang)*0.5;
    }
  }
}

function recomputeFOV(){
  vis.fill(0);
  castLightFrom(player.x, player.y, FOV_RADIUS);
  for(const t of torches){
    const dx = t.x - player.x;
    const dy = t.y - player.y;
    const maxDist = FOV_RADIUS + TORCH_LIGHT_RADIUS;
    if(dx*dx + dy*dy > maxDist*maxDist) continue;
    castLightFrom(t.x, t.y, TORCH_LIGHT_RADIUS);
  }
}

// ===== Loot / Inventory =====
const ITEM_BASES = {
  helmet:['Helmet','Cap','Hood','Cowl','Circlet'],
  chest:['Armor','Robe','Vest','Tunic','Mail'],
  legs:['Greaves','Leggings','Pants','Skirt','Kilt'],
  hands:['Gloves','Gauntlets','Wraps','Mitts','Bracers'],
  feet:['Boots','Sandals','Shoes','Sabatons','Slippers'],
  weapon:['Sword','Axe','Mace','Dagger','Bow','Wand','Staff','Spear','Halberd','Crossbow','Flail','Katana']
};
// Total base items: 37
const RARITY=[
  {n:'Common',c:'#bfbfbf',m:1.0},
  {n:'Uncommon',c:'#38c172',m:1.05},
  {n:'Magic',c:'#3490dc',m:1.1},
  {n:'Rare',c:'#eab308',m:1.35},
  {n:'Epic',c:'#a855f7',m:1.4},
  {n:'Legendary',c:'#f97316',m:1.6}
];
const RARITY_WEIGHTS=[40,30,15,8,5,2];
const WEAPON_PREFIXES=['Ancient','Flaming','Shadow','Swift','Vicious','Mystic','Dragon','Stormforged','Ethereal','Gloom','Silver','Blood','Infernal','Eternal','Sacred','Dark','Frost','Thunder','Cursed','Luminous','Valkyrie','Arcane','Ghostly'];
const WEAPON_SUFFIXES=['of Power','of Doom','of the Fox','of Frost','of Flames','of Shadows','of the Dragon','of Vengeance','of Nightmares','of the Phoenix','of Destiny','of the Ancients','of the Depths','of Kings','of Ruin','of Glory','of Fury','of the Reaper','of Whispers','of the Titan','of the Tempest','of Ages','of the Void'];
const ITEM_PREFIXES=['Sturdy','Blessed','Cursed','Enchanted','Gleaming','Guardian','Eternal','Shadowed','Dragonhide','Stormforged','Silver','Ironbound','Silent','Glacial','Luminous','Infernal','Radiant','Venerable','Mystic','Obsidian'];
const ITEM_SUFFIXES=['of Protection','of the Bear','of Fortitude','of Stealth','of the Lion','of Resilience','of Twilight','of the Wolf','of the Eagle','of the Serpent','of the Mountain','of Grace','of the Titan','of Endurance','of the Seas','of Insight','of the Wind','of Shadows','of the Void'];
const WEAPON_UNIQUES=["Shadow's Bane","Dragon's Heart","The Cleaver","Nightfall","Sunseeker","Soulreaper","Stormcaller","Frostbite","Bloodletter","Kingslayer","Dawnbringer","Voidrender","Thunderfury","Eclipse Edge","Grim Herald","Starforged","Venomspike"];

function rollRarity(){
  const total=RARITY_WEIGHTS.reduce((a,b)=>a+b,0);
  let r=rng.int(0,total-1);
  for(let i=0;i<RARITY_WEIGHTS.length;i++){
    if(r<RARITY_WEIGHTS[i]) return i;
    r-=RARITY_WEIGHTS[i];
  }
  return 0;
}

const POTION_TYPES=[
  {k:'hp', base:'Health Potion', vals:[40,60,100,160,240,400]},
  {k:'mp', base:'Mana Potion', vals:[25,35,60,100,150,250]}
];
function generateWeaponName(base){
  if(rng.next()<0.2) return WEAPON_UNIQUES[rng.int(0,WEAPON_UNIQUES.length-1)];
  const pre=rng.next()<0.5?WEAPON_PREFIXES[rng.int(0,WEAPON_PREFIXES.length-1)]+' ':'';
  const suf=rng.next()<0.5?' '+WEAPON_SUFFIXES[rng.int(0,WEAPON_SUFFIXES.length-1)]:'';
  return pre+base+suf;
}
function generateItemName(base){
  const pre=rng.next()<0.5?ITEM_PREFIXES[rng.int(0,ITEM_PREFIXES.length-1)]+' ':'';
  const suf=rng.next()<0.5?' '+ITEM_SUFFIXES[rng.int(0,ITEM_SUFFIXES.length-1)]:'';
  return pre+base+suf;
}
let lootMap=new Map();

const WEAPON_AFFIX_POOL = [
  {k:'crit', min:3, max:8, lvl:.5},
  {k:'ls', min:1, max:5, lvl:.5},
  {k:'md', min:1, max:5, lvl:.5},
  {k:'status'},
  {k:'kb', min:1, max:2, lvl:.5},
  {k:'atkSpd', min:5, max:15, lvl:.5},
  {k:'pierce', min:1, max:2, lvl:.5},
  {k:'hpMax', min:10, max:25, lvl:.5},
  {k:'speedPct', min:3, max:10, lvl:.5},
];

const ARMOR_AFFIX_POOL = [
  {k:'armor', min:5, max:15, lvl:1},
  {k:'resFire', min:5, max:15, lvl:1},
  {k:'resIce', min:5, max:15, lvl:1},
  {k:'resShock', min:5, max:15, lvl:1},
  {k:'resMagic', min:5, max:15, lvl:1},
  {k:'resPoison', min:5, max:15, lvl:1},
  {k:'hpMax', min:10, max:25, lvl:.5},
  {k:'mpMax', min:10, max:20, lvl:.5},
  {k:'speedPct', min:3, max:10, lvl:.5},
  {k:'ls', min:1, max:5, lvl:.5},
  {k:'md', min:1, max:5, lvl:.5},
  {k:'crit', min:3, max:8, lvl:.5},
];

function levelMult(lvl, factor=1){
  return 1 + (lvl - 1) * 0.1 * factor;
}

function affixMods(slot, rarityIdx, lvl=1){
  const R={};
  const mult = RARITY[rarityIdx]?.m || 1;
  if(slot==='weapon'){
    R.dmgMin=Math.floor(rng.int(1,3)*mult*levelMult(lvl));
    R.dmgMax=Math.floor(rng.int(2,6)*mult*levelMult(lvl));
  }
  const pool = slot==='weapon'?WEAPON_AFFIX_POOL:ARMOR_AFFIX_POOL;
  const maxAff = Math.min(slot==='weapon'?4:5, 1 + rarityIdx);
  const minAff = rarityIdx > 0 ? 2 : 1;
  const affCount = rng.int(minAff, maxAff);
  for(let i=0;i<affCount;i++){
    const a = pool[rng.int(0, pool.length-1)];
    if(a.k==='status'){
      if(!R.status) R.status=[];
      if(R.status.length < 4){
        let stacks = 1;
        while(stacks < 4 && rng.next() < 0.25) stacks++;
        for(let s=0; s<stacks && R.status.length < 4; s++){
          const roll=rng.int(0,4);
          const chance=rng.int(10,30)/100;
          let status;
          if(roll===0)      status={k:'burn',  dur:2200,power:1.0,chance,elem:'fire'};
          else if(roll===1) status={k:'bleed', dur:2000,power:1.0,chance,elem:'bleed'};
          else if(roll===2) status={k:'poison',dur:2200,power:1.0,chance,elem:'poison'};
          else if(roll===3) status={k:'freeze',dur:1800,power:0.4,chance,elem:'ice'};
          else              status={k:'shock', dur:2000,power:0.25,chance,elem:'shock'};
          R.status.push(status);
        }
      }
    }else{
      const factor = typeof a.lvl === 'number' ? a.lvl : (a.lvl ? 1 : 0);
      const val = rng.int(a.min,a.max) * mult;
      R[a.k]=(R[a.k]||0)+Math.floor(val*levelMult(lvl, factor));
    }
  }
  return R;
}

function seedRoomLoot(){
  if(rooms.length){
    for(const r of rooms){
      if(rng.next()<LOOT_CHANCE){
        const x=rng.int(r.x+1,r.x+r.w-2), y=rng.int(r.y+1,r.y+r.h-2);
        lootMap.set(`${x},${y}`,{color:'#ffd24a',type:'gold',amt:rng.int(5,20)});
      }
    }
  } else {
    for(let y=1;y<MAP_H-1;y++) for(let x=1;x<MAP_W-1;x++) if(map[y*MAP_W+x]===T_FLOOR && rng.next()<LOOT_CHANCE*0.3){
      lootMap.set(`${x},${y}`,{color:'#ffd24a',type:'gold',amt:rng.int(5,20)});
    }
  }
}

function pickupHere(){
  const key = `${player.x},${player.y}`;
  const it = lootMap.get(key);
  if(!it) return;
  if(it.type === 'gold'){
    player.gold += it.amt; hudGold.textContent = player.gold; showToast(`+${it.amt} gold`); lootMap.delete(key); return;
  }
  if(it.type === 'potion'){
    const pidx = inventory.potionBag.findIndex(b=>!b);
    if(pidx === -1){ showToast('Potion bag full'); return; }
    inventory.potionBag[pidx] = it; lootMap.delete(key); showToast(`Picked up ${it.name}`);
    redrawInventory();
    return;
  }
  const idx = inventory.bag.findIndex(b=>!b);
  if(idx === -1){ showToast('Bag full'); return; }
  inventory.bag[idx] = it; lootMap.delete(key); showToast(`Picked up ${it.name}`);
  redrawInventory();
}

function equipFromBag(idx){
  const it = inventory.bag[idx]; if(!it) return;
  const slot = it.slot; const prev = inventory.equip[slot];
  inventory.equip[slot] = it; inventory.bag[idx] = prev || null; showToast(`Equipped ${it.name}`);
  redrawInventory(); recalcStats();
}

function usePotionFromBag(idx){
  const it = inventory.potionBag[idx]; if(!it) return;
  usePotion(it);
  inventory.potionBag[idx]=null;
  redrawInventory();
}

function usePotion(it){
  let healed=0, restored=0;
  if(it.hp){ const before=player.hp; player.hp=Math.min(player.hpMax, player.hp+it.hp); healed=player.hp-before; }
  if(it.mp){
    if(player.class==='mage'){
      const before=player.mp; player.mp=Math.min(player.mpMax, player.mp+it.mp); restored=player.mp-before;
    }else{
      const before=player.sp; player.sp=Math.min(player.spMax, player.sp+it.mp); restored=player.sp-before;
    }
  }
  if(healed>0) addDamageText(player.x,player.y,`+${healed}`,'#76d38b');
  if(restored>0) addDamageText(player.x,player.y,`+${restored}`,'#4aa3ff');
  hpFill.style.width=`${(player.hp/player.hpMax)*100}%`; hpLbl.textContent=`HP ${player.hp}/${player.hpMax}`;
  updateResourceUI();
  showToast(`Used ${it.name}`);
}

function unequip(slot){
  const it = inventory.equip[slot]; if(!it) return;
  const idx = inventory.bag.findIndex(b=>!b); if(idx === -1){ showToast('Bag full'); return; }
  inventory.bag[idx] = it; inventory.equip[slot] = null; showToast(`Unequipped ${it.name}`);
  redrawInventory(); recalcStats();
}

function dropFromBag(idx){ const it=inventory.bag[idx]; if(!it) return; lootMap.set(`${player.x},${player.y}`,it); inventory.bag[idx]=null; showToast(`Dropped ${it.name}`); redrawInventory(); }

function sellFromBag(idx){ const it=inventory.bag[idx]; if(!it) return; const price=getSellPrice(it); player.gold+=price; hudGold.textContent=player.gold; showToast(`Sold ${it.name} for ${price}`); inventory.bag[idx]=null; redrawInventory(); }

function dropFromPotionBag(idx){ const it=inventory.potionBag[idx]; if(!it) return; lootMap.set(`${player.x},${player.y}`,it); inventory.potionBag[idx]=null; showToast(`Dropped ${it.name}`); redrawInventory(); }

function sellFromPotionBag(idx){ const it=inventory.potionBag[idx]; if(!it) return; const price=getSellPrice(it); player.gold+=price; hudGold.textContent=player.gold; showToast(`Sold ${it.name} for ${price}`); inventory.potionBag[idx]=null; redrawInventory(); }

function unequipAndSell(slot){ const it=inventory.equip[slot]; if(!it) return; const price=getSellPrice(it); inventory.equip[slot]=null; player.gold+=price; hudGold.textContent=player.gold; showToast(`Sold ${it.name} for ${price}`); redrawInventory(); recalcStats(); }

function redrawInventory(){
  recalcStats();
  let panel = document.getElementById('inventory'); if(!panel){ panel=document.createElement('div'); panel.id='inventory'; panel.className='panel'; document.body.appendChild(panel); }
  let html = '';
  html += '<div class="section-title">Character Stats</div>';
  html += '<div>';
  html += `<div class="list-row"><div>HP</div><div class="muted">${player.hp}/${currentStats.hpMax}</div></div>`;
  if(player.class==='mage')
    html += `<div class="list-row"><div>Mana</div><div class="muted">${player.mp}/${currentStats.mpMax}</div></div>`;
  else
    html += `<div class="list-row"><div>Stamina</div><div class="muted">${player.sp}/${currentStats.spMax}</div></div>`;
  html += `<div class="list-row"><div>ATK</div><div class="muted">${currentStats.dmgMin}-${currentStats.dmgMax}</div></div>`;
  html += `<div class="list-row"><div>CRIT</div><div class="muted">${currentStats.crit}%</div></div>`;
  html += `<div class="list-row"><div>Armor</div><div class="muted">${currentStats.armor}</div></div>`;
  html += `<div class="list-row"><div>Res F/I/S/M/P</div><div class="muted">${currentStats.resF}/${currentStats.resI}/${currentStats.resS}/${currentStats.resM}/${currentStats.resP}</div></div>`;
  html += '</div><div class="hr"></div>';
  html += '<div class="section-title">Equipped</div>';
  html += '<div>';
  for(const slot of SLOTS){
    const it = inventory.equip[slot];
    const name = it?`<span style="color:${it.color}">${escapeHtml(it.name)}</span>`:'-';
    html += `<div class="list-row" data-type="eq" data-slot="${slot}"><div>${slot}: ${name}</div><div class="muted">${it?shortMods(it):''}</div></div>`;
  }
  html += '</div><div class="hr"></div>';
  html += '<div class="section-title">Bag</div><div class="inv-grid">';
  for(let i=0;i<BAG_SIZE;i++){
    const it = inventory.bag[i];
    html += `<div class="list-row" data-type="bag" data-idx="${i}"><div>${i+1}. ${it?`<span style="color:${it.color}">${escapeHtml(it.name)}</span>`:'(empty)'}</div><div class="muted">${it?shortMods(it):''}</div></div>`;
  }
  html += '</div><div class="hr"></div>';
  html += '<div class="section-title">Potions</div><div class="inv-grid">';
  for(let i=0;i<POTION_BAG_SIZE;i++){
    const it = inventory.potionBag[i];
    html += `<div class="list-row" data-type="pbag" data-idx="${i}"><div>${i+1}. ${it?`<span style="color:${it.color}">${escapeHtml(it.name)}</span>`:'(empty)'}</div><div class="muted">${it?shortMods(it):''}</div></div>`;
  }
  html += '</div><div class="hr"></div>';
  html += '<div id="invDetails" class="muted">Hover an item to see details. Click bag item to Equip or Use. Click potion to Use. Click equipped item to Unequip. Press F or use the Sell button to sell. Use Drop button to drop.</div>';
  html += '<div class="actions" style="margin-top:8px"><button id="btnSell" class="btn sml" disabled>Sell</button><button id="btnDrop" class="btn sml" disabled>Drop</button></div>';
  panel.innerHTML = html;

  // events (why: keep DOM light using delegation instead of many listeners)
  panel.onmouseover = (e)=>{
    const row = e.target.closest('.list-row'); if(!row) return; showItemDetailsFromRow(row);
  };
  panel.onclick = (e)=>{
    const row = e.target.closest('.list-row'); if(row){
      const t=row.dataset.type; if(t==='bag'){ equipFromBag(parseInt(row.dataset.idx,10)); } else if(t==='eq'){ unequip(row.dataset.slot); } else if(t==='pbag'){ usePotionFromBag(parseInt(row.dataset.idx,10)); }
    }
  };
  document.getElementById('btnSell').onclick = ()=>{
    const sel = document.getElementById('invDetails').dataset.sel;
    const kind = document.getElementById('invDetails').dataset.kind;
    if(kind==='bag'){ sellFromBag(parseInt(sel,10)); }
    if(kind==='pbag'){ sellFromPotionBag(parseInt(sel,10)); }
    if(kind==='eq'){ unequipAndSell(sel); }
  };
  document.getElementById('btnDrop').onclick = ()=>{
    const sel = document.getElementById('invDetails').dataset.sel;
    const kind = document.getElementById('invDetails').dataset.kind;
    if(kind==='bag'){ dropFromBag(parseInt(sel,10)); }
    if(kind==='pbag'){ dropFromPotionBag(parseInt(sel,10)); }
  };
}

function showItemDetailsFromRow(row){
  const det = document.getElementById('invDetails');
  det.dataset.sel=''; det.dataset.kind='';
  const t=row.dataset.type;
  if(t==='bag'){
    const i=parseInt(row.dataset.idx,10); const it=inventory.bag[i]; if(!it){ setDetailsText('(empty slot)'); disableInvActions(); return; }
    det.dataset.sel=String(i); det.dataset.kind='bag';
    setDetailsText(renderDetails(it, 'bag'));
    document.getElementById('btnSell').disabled=false; document.getElementById('btnDrop').disabled=false;
  }else if(t==='pbag'){
    const i=parseInt(row.dataset.idx,10); const it=inventory.potionBag[i]; if(!it){ setDetailsText('(empty slot)'); disableInvActions(); return; }
    det.dataset.sel=String(i); det.dataset.kind='pbag';
    setDetailsText(renderDetails(it, 'bag'));
    document.getElementById('btnSell').disabled=false; document.getElementById('btnDrop').disabled=false;
  }else if(t==='eq'){
    const slot=row.dataset.slot; const it=inventory.equip[slot]; if(!it){ setDetailsText(`No ${slot} equipped.`); disableInvActions(); return; }
    det.dataset.sel=slot; det.dataset.kind='eq';
    setDetailsText(renderDetails(it, 'eq'));
    document.getElementById('btnSell').disabled=false; document.getElementById('btnDrop').disabled=true; // avoid dropping equipped directly
  }
}

function disableInvActions(){ document.getElementById('btnSell').disabled=true; document.getElementById('btnDrop').disabled=true; }
function setDetailsText(html){ const det=document.getElementById('invDetails'); det.innerHTML=html; }

function shortMods(it){
  if(it.type==='potion'){
    const bits=[];
    if(it.hp) bits.push(`HP ${it.hp}`);
    if(it.mp) bits.push(`MP ${it.mp}`);
    return bits.join(' · ');
  }
  const m=it.mods||{}; const bits=[];
  if(it.lvl) bits.push(`LVL ${it.lvl}`);
  if(m.dmgMin||m.dmgMax) bits.push(`ATK ${m.dmgMin||0}-${m.dmgMax||0}`);
  if(m.crit) bits.push(`CR ${m.crit}%`);
  if(m.armor) bits.push(`ARM ${m.armor}`);
  if(m.armorPct) bits.push(`ARM%+${m.armorPct}`);
  if(m.hpMax) bits.push(`HP+${m.hpMax}`);
  if(m.mpMax) bits.push(`MP+${m.mpMax}`);
  if(m.speedPct) bits.push(`SPD${m.speedPct>0?'+':''}${m.speedPct}%`);
  if(m.ls) bits.push(`LS ${m.ls}%`);
  if(m.md) bits.push(`MD ${m.md}%`);
  if(m.atkSpd) bits.push(`AS+${m.atkSpd}%`);
  if(m.kb) bits.push(`KB ${m.kb}`);
  if(m.pierce) bits.push(`PRC ${m.pierce}`);
  if(m.status){
    const sts = Array.isArray(m.status) ? m.status : [m.status];
    for(const st of sts){
      bits.push(`${st.k.toUpperCase()} ${Math.round((st.chance||0)*100)}%`);
    }
  }
  const rf=m.resFire||0, ri=m.resIce||0, rs=m.resShock||0, rm=m.resMagic||0, rp=m.resPoison||0;
  if(rf||ri||rs||rm||rp) bits.push(`RES F/I/S/M/P ${rf}/${ri}/${rs}/${rm}/${rp}`);
  return bits.join(' · ');
}

function renderDetails(it, origin){
  const val = getItemValue(it); const sell = getSellPrice(it);
  const lines = [];
  lines.push(`<div class="item-title" style="color:${it.color}">${escapeHtml(it.name)}</div>`);
  if(it.type==='potion'){
    const rows=[];
    lines.push(`<div class="muted">Potion · ${RARITY[it.rarity]?.n||'?'}</div>`);
    if(it.hp) rows.push(`<div>Restores <span class="mono">${it.hp}</span> HP</div>`);
    if(it.mp) rows.push(`<div>Restores <span class="mono">${it.mp}</span> ${player.class==='mage'?'Mana':'Stamina'}</div>`);
    lines.push(`<div style="margin:6px 0">${rows.join('')}</div>`);
    lines.push(`<div class="kv"><span class="pill">Value ${val}</span><span class="pill">Sell ${sell}</span>${origin==='shop'?'<span class="pill">Buy</span>':''}</div>`);
    return lines.join('');
  }
  lines.push(`<div class="muted">${it.slot} · Lv ${it.lvl||1} · ${RARITY[it.rarity]?.n||'?'}${it.armorType?` · ${it.armorType}`:''}</div>`);
  const m = it.mods||{}; const rows = [];
  if(m.dmgMin||m.dmgMax) rows.push(`<div>Attack: <span class="mono">${m.dmgMin||0}-${m.dmgMax||0}</span></div>`);
  if(m.crit) rows.push(`<div>Crit: <span class="mono">+${m.crit}%</span></div>`);
  if(m.armor) rows.push(`<div>Armor: <span class="mono">+${m.armor}</span></div>`);
  if(m.armorPct) rows.push(`<div>Armor %: <span class="mono">+${m.armorPct}%</span></div>`);
  if(m.hpMax) rows.push(`<div>HP Max: <span class="mono">+${m.hpMax}</span></div>`);
  if(m.mpMax) rows.push(`<div>${player.class==='mage'?'MP':'SP'} Max: <span class="mono">+${m.mpMax}</span></div>`);
  if(m.speedPct) rows.push(`<div>Speed: <span class="mono">${m.speedPct>0?'+':''}${m.speedPct}%</span></div>`);
  if(m.ls) rows.push(`<div>Lifesteal: <span class="mono">${m.ls}%</span></div>`);
  if(m.md) rows.push(`<div>${player.class==='mage'?'Mana':'Stamina'} Drain: <span class="mono">${m.md}%</span></div>`);
  if(m.atkSpd) rows.push(`<div>Attack Speed: <span class="mono">+${m.atkSpd}%</span></div>`);
  if(m.kb) rows.push(`<div>Knockback: <span class="mono">${m.kb}</span></div>`);
  if(m.pierce) rows.push(`<div>Projectile Pierce: <span class="mono">${m.pierce}</span></div>`);
  if(m.status){
    const sts = Array.isArray(m.status) ? m.status : [m.status];
    for(const st of sts){
      rows.push(`<div>${st.k.toUpperCase()} Chance: <span class="mono">${Math.round((st.chance||0)*100)}%</span></div>`);
    }
  }
  if(m.resFire||m.resIce||m.resShock||m.resMagic||m.resPoison){
    rows.push(`<div>Resists (F/I/S/M/P): <span class="mono">${m.resFire||0}/${m.resIce||0}/${m.resShock||0}/${m.resMagic||0}/${m.resPoison||0}%</span></div>`);
  }
  if(rows.length===0) rows.push('<div class="muted">No magical properties.</div>');
  lines.push(`<div style="margin:6px 0">${rows.join('')}</div>`);
  lines.push(`<div class="kv"><span class="pill">Value ${val}</span><span class="pill">Sell ${sell}</span>${origin==='shop'?'<span class="pill">Buy</span>':''}</div>`);
  return lines.join('');
}

// ===== Values / Shop =====
function getItemValue(it){
  if(it.type==='potion'){
    const rBase=[10,20,40,80,160,320][it.rarity||0];
    let score=0;
    if(it.hp) score+=it.hp*0.3;
    if(it.mp) score+=it.mp*0.25;
    const floorBonus=Math.max(0,floorNum-1)*2;
    return Math.max(5, Math.floor(rBase+score+floorBonus));
  }
  const rBase=[10,25,60,120,250,500][it.rarity||0];
  const slotFactor = it.slot==='weapon'?1.25:1.0;
  const m=it.mods||{}; let score=0;
  score+= (m.dmgMin||0)*4 + (m.dmgMax||0)*6;
  score+= (m.crit||0)*3 + (m.armor||0)*3;
  score+= (m.hpMax||0)*0.8 + (m.mpMax||0)*0.6 + (m.speedPct||0)*4;
  score+= (m.ls||0)*6 + (m.md||0)*6;
  score+= (m.atkSpd||0)*4 + (m.kb||0)*8 + (m.pierce||0)*12;
  if(m.status){
    const sts = Array.isArray(m.status) ? m.status : [m.status];
    for(const st of sts){
      score+= Math.round((st.chance||0)*100) * 4;
    }
  }
  score+= ((m.resFire||0)+(m.resIce||0)+(m.resShock||0)+(m.resPoison||0))*1.2 + (m.resMagic||0)*1.8;
  const floorBonus = Math.max(0,floorNum-1)*4;
  return Math.max(5, Math.floor((rBase + score)*slotFactor + floorBonus));
}
function getSellPrice(it){ return Math.floor(getItemValue(it)*0.5); }

function genShopStock(){
  inventory.shopStock.length=0;
  const count=5; for(let i=0;i<count;i++) inventory.shopStock.push(makeRandomItem());
}

function makeRandomGear(){
  const nonWeaponSlots = SLOTS.filter(s=>s!=='weapon');
  const slot = rng.next()<0.6 ? 'weapon' : nonWeaponSlots[rng.int(0, nonWeaponSlots.length-1)];
  const rarityIdx = rollRarity();
  const bases = ITEM_BASES[slot];
  const base = bases[rng.int(0, bases.length-1)];
  let baseName = base;
  if(slot==='weapon') baseName = generateWeaponName(base);
  else baseName = generateItemName(base);
  const name = `${RARITY[rarityIdx].n} ${baseName}`;
  const item = { color: RARITY[rarityIdx].c, type:'gear', slot, name, rarity: rarityIdx, lvl: floorNum, mods: affixMods(slot, rarityIdx, floorNum) };
  if(slot==='weapon'){ item.wclass = base.toLowerCase(); }
  else {
    const types = ['light','medium','heavy'];
    const t = types[rng.int(0, types.length-1)];
    const typeMods = {
      light:{armor:3,speedPct:5},
      medium:{armor:6,speedPct:0},
      heavy:{armor:10,speedPct:-10}
    };
    item.armorType = t;
    const tm = typeMods[t];
    item.mods.armor = (item.mods.armor||0) + tm.armor;
    if(tm.speedPct) item.mods.speedPct = (item.mods.speedPct||0) + tm.speedPct;
  }
  return item;
}

function makeRandomPotion(){
  const rarityIdx = rng.int(0, RARITY.length-1);
  const p = POTION_TYPES[rng.int(0, POTION_TYPES.length-1)];
  const item = { color: RARITY[rarityIdx].c, type:'potion', slot:'Potion', name:`${RARITY[rarityIdx].n} ${p.base}`, rarity:rarityIdx };
  if(p.k==='hp') item.hp = p.vals[rarityIdx];
  if(p.k==='mp') item.mp = p.vals[rarityIdx];
  return item;
}

function makeRandomItem(){
  if(rng.next()<0.25){
    const p = makeRandomPotion();
    p.price = clamp(5, 9999, Math.floor(getItemValue(p) * (1.0 + (floorNum-1)*0.05)));
    return p;
  }
  const item = makeRandomGear();
  item.price = clamp(8, 9999, Math.floor(getItemValue(item) * (1.0 + (floorNum-1)*0.05)));
  return item;
}

function renderShop(){
  const panel=document.getElementById('shop');
  let h='';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">';
  h += '<div class="section-title">Merchant</div>';
  h += '<div class="kv">Gold: <b id="shopGold" class="mono">'+player.gold+'</b></div>';
  h += '</div>';
  h += '<div class="muted" style="margin-bottom:6px">Stand on the merchant and press <b>E</b> to open/close. Click an item to buy.</div>';
  h += '<div class="shop-items">';
  for(let i=0;i<inventory.shopStock.length;i++){
    const it=inventory.shopStock[i];
    h += `<div class="shop-item">${renderDetails(it,'shop')}<div class="kv" style="margin-top:4px"><div class="pill mono">${it.price}g</div><button class="btn sml" data-buy="${i}">Buy</button></div></div>`;
  }
  h += '</div>';
  h += '<div class="hr"></div><div class="actions"><button id="shopRefresh" class="btn sml">Refresh (15g)</button><button id="shopClose" class="btn sml">Close</button></div>';
  panel.innerHTML=h;
  panel.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.id==='shopClose'){ toggleShop(false); return; }
    if(b.id==='shopRefresh'){ if(player.gold>=15){ player.gold-=15; hudGold.textContent=player.gold; genShopStock(); renderShop(); } else showToast('Need 15 gold'); return; }
    if(b.dataset.buy){ const idx=parseInt(b.dataset.buy,10); buyItem(idx); }
  };
}

function buyItem(idx){
  const it=inventory.shopStock[idx]; if(!it) return;
  if(player.gold<it.price){ showToast('Not enough gold'); return; }
  if(it.type==='potion'){
    const slot=inventory.potionBag.findIndex(b=>!b); if(slot===-1){ showToast('Potion bag full'); return; }
    player.gold-=it.price; hudGold.textContent=player.gold; inventory.potionBag[slot]=stripShopFields(it); showToast(`Bought ${it.name}`); inventory.shopStock.splice(idx,1); renderShop(); redrawInventory();
    return;
  }
  const slot=inventory.bag.findIndex(b=>!b); if(slot===-1){ showToast('Bag full'); return; }
  player.gold-=it.price; hudGold.textContent=player.gold; inventory.bag[slot]=stripShopFields(it); showToast(`Bought ${it.name}`); inventory.shopStock.splice(idx,1); renderShop(); redrawInventory();
}
function stripShopFields(it){ const {price,...rest}=it; return rest; }

function toggleShop(show){ const el=document.getElementById('shop'); el.style.display=show?'block':'none'; if(show){ renderShop(); document.getElementById('shopGold').textContent=player.gold; } }

function dealDamageToMonster(m, base, elem=null, crit=false){
  const vuln = getEffectPower(m,'shock') || 0;
  const dmgBase = Math.max(1, Math.floor(base * (1 + vuln)));
  const cap = RESIST_CAP;
  const res = elem==='fire' ? clamp(0,cap,m.resFire||0)
            : elem==='ice'  ? clamp(0,cap,m.resIce||0)
            : elem==='shock'? clamp(0,cap,m.resShock||0)
            : elem==='magic'? clamp(0,cap,m.resMagic||0)
            : elem==='poison'? clamp(0,cap,m.resPoison||0) : 0;
  const dmg = Math.max(1, Math.floor(dmgBase * (1 - res/100)));
  m.hp -= dmg; m.hitFlash = 4; playHit();
  m.aggroT = 10000; // leash to player for at least 10s after taking damage
  player.combatTimer = 0; player.healAcc = 0;
  const col = elem==='fire' ? '#ff6b4a'
            : elem==='ice'  ? '#7dd3fc'
            : elem==='shock'? '#facc15'
            : elem==='poison'? '#76d38b'
            : elem==='bleed'? '#dc2626'
            : (crit?'#ffe066':'#ffd24a');
  addDamageText(m.x,m.y,`-${dmg}`, col);
}

// ======== Status Effects (burn / freeze / shock / poison / bleed) ========
function getEffect(entity, k){ return (entity.effects||[]).find(e=>e.k===k); }
function getEffectPower(entity, k){
  const e=getEffect(entity,k); if(!e) return 0;
  if(k==='shock') return e.power||0;
  if(k==='freeze') return e.power||0;
  if(k==='burn') return e.power||0;
  if(k==='poison') return e.power||0;
  if(k==='bleed') return e.power||0;
  return 0;
}
function speedMultFromEffects(entity){
  const f = getEffectPower(entity,'freeze');
  return 1 + (f||0);
}
function resistAdjusted(target, elem, obj){
  if(target!==player || !elem) return obj;
  const cap=RESIST_CAP;
  const res = elem==='fire' ? clamp(0,cap,player.resFire||0)
            : elem==='ice' ? clamp(0,cap,player.resIce||0)
            : elem==='shock'? clamp(0,cap,player.resShock||0)
            : elem==='magic'? clamp(0,cap,player.resMagic||0)
            : elem==='poison'? clamp(0,cap,player.resPoison||0) : 0;
  const dur = Math.max(200, Math.floor(obj.dur * (1 - res/150)));
  const power = Math.max(0, obj.power * (1 - res/100));
  return { ...obj, dur, power };
}
function applyStatus(target, k, dur, power){
  if(!target.effects) target.effects=[];
  const cur = getEffect(target,k);
  if(cur){ cur.t = Math.max(cur.t, dur); cur.power = Math.max(cur.power||0, power||0); return; }
  target.effects.push({ k, t:dur, power:power||0, acc:0 });
}
function tryApplyStatus(target, status, elem){
  if(!status) return;
  if(Math.random() > (status.chance ?? 1)) return;
  const tuned = resistAdjusted(target, elem, status);
  applyStatus(target, status.k, tuned.dur, tuned.power);
  const col = elem==='fire'?'#ff6b4a'
             : elem==='ice'?'#7dd3fc'
             : elem==='shock'?'#facc15'
             : elem==='poison'?'#76d38b'
             : elem==='bleed'?'#dc2626'
             : '#b84aff';
  addDamageText(target.x, target.y, status.k.toUpperCase(), col);
}
function tickEffects(entity, dt){
  if(!entity.effects || entity.effects.length===0) return;
  for(const e of entity.effects){
    e.t -= dt;
    if(e.k==='burn'){
      e.acc=(e.acc||0)+dt; if(e.acc>=450){ e.acc=0;
        const base = 2 + Math.floor(floorNum*0.6);
        if(entity===player){ applyDamageToPlayer(Math.max(1, Math.floor(base * (e.power||1))), 'fire'); }
        else{ dealDamageToMonster(entity, Math.max(1, Math.floor(base * (e.power||1))), 'fire', false); }
      }
    }
    if(e.k==='poison'){
      e.acc=(e.acc||0)+dt; if(e.acc>=450){ e.acc=0;
        const base = 2 + Math.floor(floorNum*0.6);
        if(entity===player){ applyDamageToPlayer(Math.max(1, Math.floor(base * (e.power||1))), 'poison'); }
        else{ dealDamageToMonster(entity, Math.max(1, Math.floor(base * (e.power||1))), 'poison', false); }
      }
    }
    if(e.k==='bleed'){
      e.acc=(e.acc||0)+dt; if(e.acc>=450){ e.acc=0;
        const base = 2 + Math.floor(floorNum*0.5);
        if(entity===player){ applyDamageToPlayer(Math.max(1, Math.floor(base * (e.power||1))), 'physical'); }
        else{ dealDamageToMonster(entity, Math.max(1, Math.floor(base * (e.power||1))), 'bleed', false); }
      }
    }
  }
  entity.effects = entity.effects.filter(e=>e.t>0);
}
function drawStatusPips(ctx, entity, cx, cy){
  if(!entity.effects||entity.effects.length===0) return;
  const mapColor = (k)=> k==='burn'?'#ff6b4a'
                         :k==='freeze'?'#7dd3fc'
                         :k==='shock'?'#facc15'
                         :k==='poison'?'#76d38b'
                         :k==='bleed'?'#dc2626':'#b84aff';
  let i=0; for(const e of entity.effects){
    const x = cx - 8 + i*8, y = cy;
    ctx.fillStyle = mapColor(e.k); ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill(); i++;
    if(i>=4) break;
  }
}

// ===== Combat / Click =====
canvas.addEventListener('mousedown', (e)=>{
  if(e.button !== 0) return; // ensure left-click
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const mx=(e.clientX-rect.left)/zoom + camX;
  const my=(e.clientY-rect.top)/zoom + camY;
  const px = player.rx!==undefined?player.rx:player.x, py = player.ry!==undefined?player.ry:player.y;
  const cx = px*TILE + TILE/2, cy = py*TILE + TILE/2;
  if(mx===cx && my===cy) return;
  const ang=Math.atan2(my-cy,mx-cx);
  const dx=Math.cos(ang), dy=Math.sin(ang);
  player.faceDx=dx; player.faceDy=dy;
  performPlayerAttack(dx,dy);
});

function currentAtk(){
  // why: single source-of-truth for attack numbers (incl. level & gear)
  let min=2,max=4,crit=5,ls=0,md=0;
  const lvlBonus = Math.floor((player.lvl-1)*0.6); min+=lvlBonus; max+=lvlBonus;
  for(const slot of SLOTS){
    const m=inventory.equip[slot]?.mods||{};
    if(slot==='weapon'){ min+=m.dmgMin||0; max+=m.dmgMax||0; }
    if(m.crit) crit+=m.crit;
    if(m.ls) ls+=m.ls;
    if(m.md) md+=m.md;
  }
  return {min,max,crit,ls,md};
}

function applyDamageToPlayer(dmg, type='physical'){
  coreApplyDamageToPlayer(player, dmg, {
    type,
    floor: floorNum,
    damageTexts,
    getEffectPower,
    playHit,
    showRespawn
  });
}


// ===== Player weapon profiles & directional attacks =====
const WEAPON_RULES = {
  sword: {kind:'melee', reach:2, cooldown:240, status:{k:'bleed', elem:'bleed', dur:2000, power:1.0, chance:0.3}},
  axe:   {kind:'melee', reach:1, cooldown:300, status:{k:'bleed', elem:'bleed', dur:2200, power:1.2, chance:0.35}, kb:1},
  mace:  {kind:'melee', reach:1, cooldown:300, status:{k:'bleed', elem:'bleed', dur:2200, power:1.1, chance:0.3}, kb:1},
  dagger:{kind:'melee', reach:1, cooldown:160, status:{k:'bleed', elem:'bleed', dur:1600, power:0.8, chance:0.4}},
  // speeds now in tiles/sec
  bow:   {kind:'ranged', projSpeed:14, projRange:14, cooldown:320, dtype:'ranged', status:{k:'poison', elem:'poison', dur:2200, power:1.0, chance:0.3}},
  crossbow:{kind:'ranged', projSpeed:16, projRange:16, cooldown:360, dtype:'ranged', status:{k:'freeze', elem:'ice', dur:1800, power:0.4, chance:0.35}},
  wand:  {kind:'ranged', projSpeed:12, projRange:12, cooldown:260, dtype:'magic', elem:'fire',  status:{k:'burn',  dur:2200, power:1.0, chance:0.55}},
  staff: {kind:'ranged', projSpeed:10, projRange:12, cooldown:300, dtype:'magic', elem:'shock', status:{k:'shock', dur:2000, power:0.25, chance:0.60}},
  _default:{kind:'melee', reach:2, cooldown:260, status:{k:'bleed', elem:'bleed', dur:2000, power:1.0, chance:0.25}}
};
function wclassFromName(n){
  if(!n) return null; const s=n.toLowerCase();
  for(const k of ['sword','axe','mace','dagger','bow','wand','staff','spear','halberd','crossbow','flail','katana']) if(s.includes(k)) return k;
  return null;
}
function currentWeaponProfile(){
  const it = inventory.equip.weapon;
  const wc = it?.wclass || wclassFromName(it?.name) || null;
  const base = WEAPON_RULES[wc] || WEAPON_RULES._default;
  return {...base};
}
function firstMonsterAt(tx,ty){ return monsters.find(mm=>mm.x===tx && mm.y===ty); }
function performPlayerAttack(dx,dy,dmgMult=1){
  if(player.atkCD>0) return;
  const prof = currentWeaponProfile();
  const mag = Math.hypot(dx,dy);
  if(mag===0) return;
  const ndx = dx/mag, ndy = dy/mag;
  player.faceDx = ndx; player.faceDy = ndy; playAttack();
  const {min,max,crit,ls,md} = currentAtk();
  let dmg=rng.int(min,max);
  const wasCrit=(Math.random()*100<crit); if(wasCrit) dmg=Math.floor(dmg*1.5);
  dmg=Math.max(1,Math.floor(dmg*dmgMult));
  const wStatus = inventory.equip.weapon?.mods?.status;
  const atkStatuses = [];
  if(wStatus){
    const ws = Array.isArray(wStatus) ? wStatus : [wStatus];
    atkStatuses.push(...ws);
  }
  if(prof.status) atkStatuses.push(prof.status);
  const wmods = inventory.equip.weapon?.mods || {};
  const kb = (wmods.kb || 0) + (prof.kb || 0);
  const aspd = wmods.atkSpd || 0;
  const pierce = wmods.pierce || 0;
  if(prof.kind==='melee'){
    const reach = prof.reach ?? 2;
    const cone = (prof.cone || 35) * Math.PI / 180;
    let target=null, bestDist=Infinity;
    for(const m of monsters){
      const dxm = m.x - player.x, dym = m.y - player.y;
      const dist = Math.hypot(dxm,dym);
      if(dist>reach || dist===0) continue;
      const ang = Math.acos((ndx*dxm + ndy*dym)/dist);
      if(ang > cone/2) continue;
      if(!clearPath8(player.x, player.y, m.x, m.y)) continue;
      if(dist < bestDist){ target=m; bestDist=dist; }
    }
    if(target){
      dealDamageToMonster(target, dmg, null, wasCrit);
      for(const st of atkStatuses){
        tryApplyStatus(target, st, st.elem);
      }
      if(ls>0){ const heal=Math.max(1,Math.floor(dmg*ls/100)); player.hp=Math.min(player.hpMax, player.hp+heal); addDamageText(player.x,player.y,`+${heal}`,'#76d38b'); }
      if(md>0){ const gain=Math.max(1,Math.floor(dmg*md/100)); if(player.class==='mage'){ player.mp=Math.min(player.mpMax,player.mp+gain); } else { player.sp=Math.min(player.spMax,player.sp+gain); } addDamageText(player.x,player.y,`+${gain}`,'#4aa3ff'); updateResourceUI(); }
      if(kb>0){
        const kdx=Math.sign(ndx), kdy=Math.sign(ndy);
        for(let i=0;i<kb;i++){ if(!tryMoveMonster(target,kdx,kdy)) break; }
      }
    }
    let cd = prof.cooldown;
    if(aspd>0) cd = Math.max(60, Math.floor(cd * (1 - aspd/100)));
    player.atkCD = cd;
  } else {
    // ranged projectile
    projectiles.push({
      x: player.x+0.5, y: player.y+0.5, dx: ndx, dy: ndy,
      speed: prof.projSpeed, damage:dmg, type: prof.dtype||'ranged', elem: (atkStatuses[0]?.elem || prof.elem || null),
      owner:'player', alive:true, maxDist: prof.projRange, dist:0, ls, md,
      status: atkStatuses, kb, pierce
    });
    let cd = prof.cooldown;
    if(aspd>0) cd = Math.max(60, Math.floor(cd * (1 - aspd/100)));
    player.atkCD = cd;
  }
}

// ===== Monster AI & Movement =====
function tryMoveMonster(m, dx, dy, dur=140){
  if(dx===0 && dy===0) return false;
  const nx=m.x+dx, ny=m.y+dy;
  if(!walkable(nx,ny)) return false;
  if(firstMonsterAt(nx,ny) || (nx===player.x && ny===player.y)) return false;
  m.x=nx; m.y=ny;
  dur = Math.round(dur * ENEMY_SPEED_MULT);
  if(smoothEnabled){ m.fromX=m.rx; m.fromY=m.ry; m.toX=nx; m.toY=ny; m.moveT=0; m.moving=true; m.moveDur=dur; }
  else{ m.rx=m.x; m.ry=m.y; m.moving=false; m.moveT=1; }
  return true;
}

function meleeIfAdjacent(m){
  if(Math.abs(m.x-player.x)+Math.abs(m.y-player.y)!==1) return false;
  if(getEffect(player,'invis')) return false;
  if(m.atkCD>0) return false;
  const dmg = rng.int(m.dmgMin, m.dmgMax);
  applyDamageToPlayer(dmg);
  m.atkCD = rng.int(20, 35);
  return true;
}

function slimeAI(m, dt, dx, dy, manhattan){
  if(m.spriteKey==='slime_shadow'){
    if(m.atkCD===0 && manhattan<= (m.elite?8:6)){
      const spots=[];
      for(let tx=player.x-1; tx<=player.x+1; tx++){
        for(let ty=player.y-1; ty<=player.y+1; ty++){
          if(tx===player.x && ty===player.y) continue;
          if(!walkable(tx,ty)) continue;
          if(firstMonsterAt(tx,ty)) continue;
          spots.push({x:tx,y:ty});
        }
      }
      if(spots.length>0){
        const s=spots[rng.int(0,spots.length-1)];
        m.x=s.x; m.y=s.y;
        m.rx=m.x; m.ry=m.y; m.fromX=m.x; m.fromY=m.y; m.toX=m.x; m.toY=m.y; m.moving=false; m.moveT=1;
        const dmg=rng.int(m.dmgMin,m.dmgMax);
        applyDamageToPlayer(dmg);
        m.atkCD=rng.int(40,60);
        m.moveCD=Math.round(rng.int(6,10)*ENEMY_SPEED_MULT);
      }
    }
    if(m.moveCD===0){
      const stepX=tryMoveMonster(m, dx, 0, 150);
      if(!stepX) tryMoveMonster(m, 0, dy, 150);
      m.moveCD=Math.round(rng.int(6,10)*ENEMY_SPEED_MULT);
    }
    return;
  }
  if(m.state.chargeSteps>0){
    if(tryMoveMonster(m, m.state.cdx, m.state.cdy, 110)) m.state.chargeSteps--;
    else m.state.chargeSteps=0;
    return;
  }
  if(m.moveCD===0){
    const chance = m.elite?0.5:0.3;
    const steps = m.elite?3:2;
    if(manhattan<=3 && m.atkCD===0 && rng.next()<chance){
      m.state.cdx = dx; m.state.cdy = dy; m.state.chargeSteps = steps;
      m.atkCD = 12;
    }else{
      const stepX = tryMoveMonster(m, dx, 0, 150);
      if(!stepX) tryMoveMonster(m, 0, dy, 150);
    }
    m.moveCD = Math.round(rng.int(6, 10) * ENEMY_SPEED_MULT);
  }
}

function batAI(m, dt, dx, dy, manhattan){
  if(m.state.swoop>0){
    const ok = tryMoveMonster(m, m.state.sdx, m.state.sdy, 90);
    m.state.swoop = ok ? m.state.swoop-1 : 0;
    return;
  }
  const swoopRange = m.elite?8:6;
  if(manhattan<=swoopRange && m.atkCD===0 && m.moveCD===0){
    m.state.sdx = dx!==0?dx:0; m.state.sdy = dy!==0?dy:0;
    if(m.state.sdx===0 && m.state.sdy===0){ m.state.sdx = (rng.next()<0.5?1:-1); }
    m.state.swoop = m.elite?3:2;
    m.atkCD = 18;
    m.moveCD = Math.round(2 * ENEMY_SPEED_MULT);
    return;
  }
  if(m.moveCD===0){
    if(!tryMoveMonster(m, dx, dy, 110)){
      if(!tryMoveMonster(m, dx, 0, 110)) tryMoveMonster(m, 0, dy, 110);
    }
    m.moveCD = Math.round(rng.int(4, 8) * ENEMY_SPEED_MULT);
  }
}

function skeletonAI(m, dt, dx, dy, manhattan){
  if(manhattan<=7 && clearPathCardinal(m.x,m.y,player.x,player.y) && m.atkCD===0){
    const adx = sign(player.x - m.x), ady = sign(player.y - m.y);
    let elem='ranged', status=null;
    if(m.spriteKey==='skeleton_red'){ elem='fire'; status={k:'burn',  dur:2200, power:1.0, chance:0.9}; }
    else if(m.spriteKey==='skeleton_green'){ elem='poison'; status={k:'poison',dur:2200, power:1.0, chance:0.9}; }
    projectiles.push({ x:m.x+0.5, y:m.y+0.5, dx:adx, dy:ady, speed:12, damage:rng.int(m.dmgMin,m.dmgMax), type:'ranged', elem, owner:'enemy', alive:true, maxDist:12, dist:0, status });
    if(m.elite){
      projectiles.push({ x:m.x+0.5, y:m.y+0.5, dx:adx, dy:ady, speed:14, damage:rng.int(m.dmgMin,m.dmgMax), type:'ranged', elem, owner:'enemy', alive:true, maxDist:12, dist:0, status });
    }
    m.atkCD = rng.int(26, 40);
    return;
  }
  if(m.moveCD===0){
    if(!tryMoveMonster(m, dx, 0, 160)) tryMoveMonster(m, 0, dy, 160);
    m.moveCD = Math.round(rng.int(6, 10) * ENEMY_SPEED_MULT);
  }
}

function goblinAI(m, dt, dx, dy, manhattan){
  if(m.moveCD===0){
    if(!tryMoveMonster(m, dx, 0, 120)) tryMoveMonster(m, 0, dy, 120);
    if(m.elite){
      if(!tryMoveMonster(m, dx, 0, 120)) tryMoveMonster(m, 0, dy, 120);
    }
    m.moveCD = Math.round(rng.int(4, 8) * ENEMY_SPEED_MULT);
  }
}

function ghostAI(m, dt, dx, dy, manhattan){
  if(m.moveCD===0){
    if(!tryMoveMonster(m, dx, dy, 140)){
      if(!tryMoveMonster(m, dx, 0, 140)) tryMoveMonster(m, 0, dy, 140);
    }
    if(m.elite){
      if(!tryMoveMonster(m, dx, dy, 140)){
        if(!tryMoveMonster(m, dx, 0, 140)) tryMoveMonster(m, 0, dy, 140);
      }
    }
    m.moveCD = Math.round(rng.int(6, 12) * ENEMY_SPEED_MULT);
  }
}

function mageAI(m, dt, dx, dy, manhattan){
  const preferRange = 5;
  if(manhattan<=8 && clearPath8(m.x,m.y,player.x,player.y) && m.atkCD===0){
    const adx = sign(player.x - m.x), ady = sign(player.y - m.y);
    const roll = rng.next(); let elem='magic', status=null, speed=10, maxDist=10;
    if(roll<0.34){ elem='fire';  status={k:'burn',  dur:2200, power:1.0, chance:0.9}; }
    else if(roll<0.67){ elem='ice';   status={k:'freeze',dur:1800, power:0.40, chance:0.9}; }
    else { elem='shock'; status={k:'shock', dur:2000, power:0.25, chance:0.9}; }
    projectiles.push({ x:m.x+0.5, y:m.y+0.5, dx:adx, dy:ady, speed, damage:rng.int(m.dmgMin,m.dmgMax+2), type:'magic', elem, owner:'enemy', alive:true, maxDist, dist:0, status });
    if(m.elite){
      projectiles.push({ x:m.x+0.5, y:m.y+0.5, dx:adx, dy:ady, speed:speed+2, damage:rng.int(m.dmgMin,m.dmgMax+2), type:'magic', elem, owner:'enemy', alive:true, maxDist, dist:0, status });
    }
    m.atkCD = rng.int(24, 34);
    return;
  }
  if(m.moveCD===0){
    if(manhattan<=preferRange-1){
      if(!tryMoveMonster(m, -dx, 0, 150)) tryMoveMonster(m, 0, -dy, 150);
    }else{
      if(!tryMoveMonster(m, dx, 0, 150)) tryMoveMonster(m, 0, dy, 150);
    }
    if(m.elite){
      if(manhattan<=preferRange-1){
        if(!tryMoveMonster(m, -dx, 0, 150)) tryMoveMonster(m, 0, -dy, 150);
      }else{
        if(!tryMoveMonster(m, dx, 0, 150)) tryMoveMonster(m, 0, dy, 150);
      }
    }
    m.moveCD = Math.round(rng.int(6, 10) * ENEMY_SPEED_MULT);
  }
}

const MONSTER_BEHAVIORS = {0:slimeAI,1:batAI,2:skeletonAI,3:mageAI,4:mageAI,5:goblinAI,6:ghostAI};

function monsterAI(m, dt){
  m.atkCD = Math.max(0, m.atkCD - 1);
  m.moveCD = Math.max(0, m.moveCD - 1);
  m.aggroT = Math.max(0, (m.aggroT || 0) - dt);
  if(getEffect(player,'invis')) return;
  if(meleeIfAdjacent(m)) return;
  const dx = sign(player.x - m.x), dy = sign(player.y - m.y);
  const manhattan = Math.abs(player.x-m.x)+Math.abs(player.y-m.y);
  if(manhattan>AGGRO_RANGE && (m.aggroT||0)<=0) return;
  const fn = MONSTER_BEHAVIORS[m.type] || mageAI;
  fn(m, dt, dx, dy, manhattan);
}

// ===== Drawing =====
function drawLootIcon(it, x, y){
  ctx.save();
  if(it.rarity>0){
    ctx.shadowColor = it.color;
    ctx.shadowBlur = 4 + it.rarity*2;
  }
  ctx.fillStyle = it.color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  if(it.type==='gold'){
    const frames = ASSETS.sprites.coin.frames;
    const idx = Math.floor(performance.now()/100) % frames.length;
    ctx.drawImage(frames[idx], x, y);
  }else if(it.type==='potion'){
    const spr = it.hp ? ASSETS.sprites.potion_hp : ASSETS.sprites.potion_mp;
    const frames = spr.frames;
    const idx = frames.length ? Math.floor(performance.now()/100)%frames.length : 0;
    ctx.drawImage(frames[idx]||spr.cv, x+1, y+1);
  }else{
    switch(it.slot){
      case 'weapon':
        if(it.wclass === 'bow'){
          const spr = ASSETS.sprites.bow_loot;
          const frames = spr.frames;
          const idx = frames.length ? Math.floor(performance.now()/100)%frames.length : 0;
          ctx.drawImage(frames[idx]||spr.cv, x, y);
        }else if(it.wclass === 'sword'){
          const spr = ASSETS.sprites.sword_loot;
          const frames = spr.frames;
          const idx = frames.length ? Math.floor(performance.now()/100)%frames.length : 0;
          ctx.drawImage(frames[idx]||spr.cv, x, y);
        }else{
          ctx.fillRect(x+6, y, 2, 10);
          ctx.strokeRect(x+6, y, 2, 10);
          ctx.fillRect(x+4, y+8, 6, 2);
          ctx.strokeRect(x+4, y+8, 6, 2);
        }
        break;
      case 'helmet':
        ctx.beginPath();
        ctx.arc(x+7, y+6, 5, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(x+2, y+6, 10, 6);
        ctx.strokeRect(x+2, y+6, 10, 6);
        break;
      case 'chest': {
        const spr = ASSETS.sprites.chest_loot;
        const frames = spr.frames;
        const idx = frames.length ? Math.floor(performance.now()/100)%frames.length : 0;
        ctx.drawImage(frames[idx]||spr.cv, x, y);
        break;
      }
      case 'legs':
        ctx.fillRect(x+4, y+3, 3, 8);
        ctx.strokeRect(x+4, y+3, 3, 8);
        ctx.fillRect(x+7, y+3, 3, 8);
        ctx.strokeRect(x+7, y+3, 3, 8);
        break;
      case 'hands':
        ctx.beginPath();
        ctx.arc(x+7, y+7, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'feet':
        ctx.fillRect(x+3, y+8, 4, 4);
        ctx.strokeRect(x+3, y+8, 4, 4);
        ctx.fillRect(x+7, y+8, 4, 4);
        ctx.strokeRect(x+7, y+8, 4, 4);
        break;
      default:
        ctx.fillRect(x, y, 14, 14);
        ctx.strokeRect(x, y, 14, 14);
    }
  }
  ctx.restore();
}

function draw(dt){
  const camTileX = (smoothEnabled && player.rx!==undefined ? player.rx : player.x);
  const camTileY = (smoothEnabled && player.ry!==undefined ? player.ry : player.y);
  camX = camTileX*TILE - (VIEW_W/2)/zoom;
  camY = camTileY*TILE - (VIEW_H/2)/zoom;

  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  ctx.save();
  ctx.scale(zoom, zoom);
  renderLayers(ctx, floorLayer, wallLayer, camX, camY);

  // hazards
  const now = performance.now();
  if(ASSETS.sprites.lava){
    const lframes = ASSETS.sprites.lava.frames;
    const lidx = Math.floor(now/200)%lframes.length;
    for(const h of lavaTiles){
      const idx=h.y*MAP_W + h.x; if(!vis[idx]) continue;
      ctx.drawImage(lframes[lidx], h.x*TILE - camX, h.y*TILE - camY);
    }
  }
  if(ASSETS.sprites.spike){
    const sframes = ASSETS.sprites.spike.frames;
    const sidx = Math.floor(now/200)%sframes.length;
    for(const h of spikeTraps){
      const idx=h.y*MAP_W + h.x; if(!vis[idx]) continue;
      ctx.drawImage(sframes[sidx], h.x*TILE - camX, h.y*TILE - camY);
    }
  }

  // torches
  for(const t of torches){
    const idx = t.y*MAP_W + t.x;
    if(!vis[idx]) continue;
    const tx = t.x*TILE - camX + TILE/2;
    const ty = t.y*TILE - camY + TILE/2;
    const flick = 0.7 + 0.3*Math.sin(now*0.005 + t.phase);
    const rad = 6 + flick*2;
    ctx.globalCompositeOperation='lighter';
    const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, rad*2);
    g.addColorStop(0, `rgba(255,200,80,${0.6*flick})`);
    g.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(tx, ty, rad*2, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle = `rgba(255,180,50,${0.8*flick})`;
    ctx.beginPath(); ctx.arc(tx, ty, rad, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#663300';
    ctx.fillRect(tx-1, ty+rad-2, 2, 6);
  }

  // portal (stairs replacement) sprite
  const stairsX = stairs.x*TILE - camX + (TILE-48)/2; const stairsY = stairs.y*TILE - camY + (TILE-48)/2;
  ASSETS.sprites.stairs.draw(performance.now());
  ctx.drawImage(ASSETS.sprites.stairs.cv, stairsX, stairsY);

  // merchant (sprite)
  if(vis[merchant.y*MAP_W+merchant.x]){
    const mx = merchant.x*TILE - camX + (TILE-24)/2; const my = merchant.y*TILE - camY + (TILE-24)/2;
    const sprite = merchantStyle==='goblin'? ASSETS.sprites.shop_goblin.cv : ASSETS.sprites.shop_stall.cv;
    ctx.drawImage(sprite, mx, my);
  }

  // loot
  for(const [k,it] of lootMap.entries()){
    const [lx,ly]=k.split(',').map(Number);
    if(vis[ly*MAP_W+lx]){
      const lxpx = lx*TILE - camX + (TILE-14)/2;
      const lypy = ly*TILE - camY + (TILE-14)/2;
      drawLootIcon(it, lxpx, lypy);
    }
  }

  // monsters (sprites by type)
  for(const m of monsters){
    if(!vis[m.y*MAP_W+m.x]) continue;
    const mtx = (m.rx!==undefined ? m.rx : m.x);
    const mty = (m.ry!==undefined ? m.ry : m.y);
    const size = m.spriteSize || 24;
    const mx = mtx*TILE - camX + (TILE-size)/2; const my = mty*TILE - camY + (TILE-size)/2;
    const key = m.spriteKey || (m.type===0?'slime' : m.type===1?'bat' : m.type===2?'skeleton' : m.type===5?'goblin' : m.type===6?'ghost' : 'mage');
    const spr = ASSETS.sprites[key];
    let frame = spr.cv;
    if(spr.frames && spr.frames.length>0){
      const animIdx = Math.floor(now/200) % spr.frames.length;
      frame = spr.frames[animIdx];
    }
    if(m.elite || m.miniBoss || m.bigBoss){
      const pulse = 0.5 + 0.5*Math.sin(now*0.002);
      const cx = mx + size/2;
      const cy = my + size/2;
      const inner = size/2;
      const outer = inner + 8 + pulse*4;
      const g = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,0,0,${0.4*pulse})`);
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, outer, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(frame, mx, my);
    if(m.hitFlash>0){ ctx.globalAlpha=0.5; ctx.fillStyle='#ff6666'; ctx.fillRect(mx,my,size,size); ctx.globalAlpha=1; }
    // hp bar
    ctx.fillStyle='#111'; ctx.fillRect(mx, my-6, size, 3);
    ctx.fillStyle='#e33'; const hw=size*(Math.max(0,m.hp)/m.hpMax); ctx.fillRect(mx, my-6, hw, 3);
    // status pips over bar
    drawStatusPips(ctx, m, mx+size/2, my-9);
    if(m.hitFlash>0) m.hitFlash--;
    if(m.hp<=0){
      player.kills++; player.score += SCORE_PER_KILL; updateScoreUI();
      if(m.miniBoss){
        if(Math.random()<MONSTER_LOOT_CHANCE){ dropGearNear(m.x,m.y); }
        lootMap.set(`${m.x},${m.y}`,{color:'#ffd24a',type:'gold',amt:rng.int(8,20)});
      } else {
        if(Math.random()<MONSTER_LOOT_CHANCE) dropLoot(m.x,m.y);
        if(Math.random()<0.55){ lootMap.set(`${m.x},${m.y}`,{color:'#ffd24a',type:'gold',amt:rng.int(3,12)}); }
      }
      grantXP(m.xp);
      const idx=monsters.indexOf(m); if(idx>=0) monsters.splice(idx,1);
    }
  }

  // projectiles
  for(const p of projectiles){
    if(!p.alive) continue;
    let key;
    if(p.type==='ranged'){
      if(p.elem==='fire') key='arrow_fire';
      else if(p.elem==='shock') key='arrow_shock';
      else if(p.elem==='ice') key='arrow_ice';
      else if(p.elem==='poison') key='arrow_poison';
      else key='arrow';
    }else{
      if(p.elem==='fire') key='proj_fire';
      else if(p.elem==='poison') key='proj_poison';
      else if(p.elem==='ice') key='proj_ice';
      else if(p.elem==='shock') key='proj_shock';
      else if(p.elem==='blast') key='proj_blast';
      else key='proj_magic';
    }
    const spr = ASSETS.sprites[key];
    const frame = spr.frames[Math.floor(now/150) % spr.frames.length];
    const size = spr.cv.width;
    const px = p.x*TILE - camX - size/2;
    const py = p.y*TILE - camY - size/2;
    if(p.type==='ranged'){
      const ang = Math.atan2(p.dy, p.dx);
      ctx.save();
      ctx.translate(px+size/2, py+size/2);
      ctx.rotate(ang);
      ctx.drawImage(frame, -size/2, -size/2);
      ctx.restore();
    }else{
      ctx.drawImage(frame, px, py);
    }
  }

  // player (sprite)
  const ptx = (smoothEnabled && player.rx!==undefined ? player.rx : player.x);
  const pty = (smoothEnabled && player.ry!==undefined ? player.ry : player.y);
  const px = ptx*TILE - camX + (TILE-24)/2; const py = pty*TILE - camY + (TILE-24)/2;
  const pspr = ASSETS.sprites[playerSpriteKey];
  const anim = player.moving ? pspr.move : pspr.idle;
  const frame = anim[Math.floor(now/200) % anim.length];
  const invis=getEffect(player,'invis');
  if(invis) ctx.globalAlpha=0.4;
  ctx.drawImage(frame, px, py);
  if(invis) ctx.globalAlpha=1;
  // player status pips
  drawStatusPips(ctx, player, px+12, py-9);

  // floating damage texts
  for(const t of damageTexts){
    const tx = t.tx*TILE - camX;
    const ty = t.ty*TILE - camY - (t.age/100)*20;
    ctx.fillStyle = t.color || '#ff6b6b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(t.text, tx+8, ty);
    t.age += dt;
  }
  damageTexts = damageTexts.filter(t=>t.age < t.ttl);

  // fog
  ctx.fillStyle='#000';
  for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){ if(fog[y*MAP_W+x]===0) ctx.fillRect(x*TILE - camX, y*TILE - camY, TILE, TILE); }
  ctx.fillStyle='rgba(0,0,0,0.6)';
  for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){ const idx=y*MAP_W+x; const v=fog[idx]; const vv=vis[idx]; if(v && !vv) ctx.fillRect(x*TILE - camX, y*TILE - camY, TILE, TILE); }

  ctx.restore();
  // HUD
  hpFill.style.width=(100*player.hp/player.hpMax).toFixed(0)+'%';
  updateResourceUI();
  updateXPUI();
  hpLbl.textContent=`HP ${player.hp}/${player.hpMax}`;
}

// ===== Update (smooth tween + 8-dir) =====
function update(dt){
  if(gameOver || paused) return;
  player.timeSurvived += dt;
  player.score += SCORE_PER_SECOND * (dt/1000);
  scoreUpdateTimer += dt;
  player.combatTimer += dt;
  // Dynamic music based on combat intensity
  const threatNearby = monsters.some(m => Math.abs(m.x - player.x) + Math.abs(m.y - player.y) < 8);
  const bossNearby = monsters.some(m => (m.bigBoss || m.miniBoss) && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) < 10);
  if (bossNearby && (player.combatTimer < OUT_OF_COMBAT_HEAL_DELAY || threatNearby)) {
    playBossMusic();
  } else if (player.combatTimer < OUT_OF_COMBAT_HEAL_DELAY || threatNearby) {
    playCombatMusic();
  } else {
    playCalmMusic();
  }
  if(player.combatTimer > OUT_OF_COMBAT_HEAL_DELAY){
    if(player.hp < player.hpMax){
      player.healAcc += OUT_OF_COMBAT_HEAL_RATE * dt/1000;
      const heal = Math.floor(player.healAcc);
      if(heal > 0){
        player.hp = Math.min(player.hpMax, player.hp + heal);
        player.healAcc -= heal;
      }
    }
    if(player.mp < player.mpMax){
      player.manaAcc += OUT_OF_COMBAT_MANA_RATE * dt/1000;
      const mpRegen = Math.floor(player.manaAcc);
      if(mpRegen > 0){
        player.mp = Math.min(player.mpMax, player.mp + mpRegen);
        player.manaAcc -= mpRegen;
      }
    }
    if(player.sp < player.spMax){
      player.stamAcc += OUT_OF_COMBAT_STAM_RATE * dt/1000;
      const spRegen = Math.floor(player.stamAcc);
      if(spRegen > 0){
        player.sp = Math.min(player.spMax, player.sp + spRegen);
        player.stamAcc -= spRegen;
      }
    }
  }
  if(scoreUpdateTimer >= 1000){ updateScoreUI(); scoreUpdateTimer = 0; }
  // init render state
  if(player.rx===undefined){
    player.rx=player.x; player.ry=player.y; player.fromX=player.x; player.fromY=player.y; player.toX=player.x; player.toY=player.y; player.moving=false; player.moveT=1; player.moveDur=player.stepDelay; baseStepDelay = player.stepDelay || baseStepDelay;
  }
  for(const m of monsters){ if(m.rx===undefined){ m.rx=m.x; m.ry=m.y; m.moving=false; m.moveT=1; m.moveDur=140; } }

  // inputs
  player.stepCD = Math.max(0, player.stepCD - dt);
  if(player.stepCD<=0 && !player.moving){
    const up=!!(keys['arrowup']||keys['w']);
    const down=!!(keys['arrowdown']||keys['s']);
    const left=!!(keys['arrowleft']||keys['a']);
    const right=!!(keys['arrowright']||keys['d']);
    const dx = (right && !left) ? 1 : (left && !right) ? -1 : 0;
    const dy = (down && !up) ? 1 : (up && !down) ? -1 : 0;
    if(dx||dy){
      // update facing when moving
      player.faceDx = dx; player.faceDy = dy;
      if(canMoveFrom(player.x, player.y, dx, dy)){
        const nx=player.x+dx, ny=player.y+dy;
        if(!firstMonsterAt(nx,ny)){
          player.x=nx; player.y=ny; pickupHere(); recomputeFOV(); checkHazard(player.x,player.y);
          const diag = (dx!==0 && dy!==0) ? Math.SQRT2 : 1;
          const gearFactor = (1 - Math.min(0.5, player.speedPct/100));
          const freezeMul = speedMultFromEffects(player);
          const dur = Math.max(60, baseStepDelay * gearFactor * diag * freezeMul);
          player.moveDur = dur; player.stepCD = dur; playFootstep();
          if(smoothEnabled){ player.fromX=player.rx; player.fromY=player.ry; player.toX=player.x; player.toY=player.y; player.moveT=0; player.moving=true; }
          else{ player.rx=player.x; player.ry=player.y; player.moving=false; player.moveT=1; }
        }
      }
    }
  }

  // advance player tween
  if(smoothEnabled && player.moving){
    player.moveT = Math.min(1, player.moveT + dt / player.moveDur);
    const t=smoothstep01(player.moveT);
    player.rx=lerp(player.fromX,player.toX,t); player.ry=lerp(player.fromY,player.toY,t);
    if(player.moveT>=1){ player.moving=false; player.rx=player.toX; player.ry=player.toY; }
  }else{ player.rx=player.x; player.ry=player.y; }

  // attack cooldown
  player.atkCD = Math.max(0, player.atkCD - dt);
  // standing in lava adds burn duration equal to time spent
  const tileUnder = map[player.y * MAP_W + player.x];
  if(tileUnder === T_LAVA){
    const cur = getEffect(player, 'burn');
    const dur = (cur ? cur.t : 0) + dt * 2;
    const pow = cur ? cur.power : 1.0;
    applyStatus(player, 'burn', dur, pow);
  }
  // status tick
  tickEffects(player, dt);

  // monster AI ticks every frame
  for(const m of monsters){ monsterAI(m, dt); }
  // advance monster tweens
  for(const m of monsters){
    tickEffects(m, dt);
    if(m.moving){ m.moveT=Math.min(1,m.moveT + dt / m.moveDur); const t=smoothstep01(m.moveT); m.rx=lerp(m.fromX,m.toX,t); m.ry=lerp(m.fromY,m.toY,t); if(m.moveT>=1){ m.moving=false; m.rx=m.toX; m.ry=m.toY; } }
    else{ m.rx=m.x; m.ry=m.y; }
  }

  for(const p of projectiles){
    if(!p.alive) continue;
    // move: speed is tiles/sec -> tiles per frame
    const nx = p.x + p.dx * (p.speed * dt/1000);
    const ny = p.y + p.dy * (p.speed * dt/1000);
    const stepLen = Math.hypot(nx - p.x, ny - p.y);
    p.x = nx; p.y = ny; p.dist = (p.dist||0) + stepLen;
    const tx = Math.floor(p.x), ty = Math.floor(p.y);
    // stop on walls
    if(isBlock(tx,ty)){ p.alive=false; continue; }
    // hit player if sharing tile
    if(p.owner!=='player' && tx===player.x && ty===player.y){
      applyDamageToPlayer(p.damage, p.elem || p.type || 'ranged');
      if(p.status){
        const sts = Array.isArray(p.status) ? p.status : [p.status];
        for(const st of sts){ tryApplyStatus(player, st, st.elem); }
      }
      p.alive=false;
    }
    // hit monster if player-owned
    if(p.owner==='player'){
      const m = monsters.find(mm=>mm.x===tx && mm.y===ty);
      if(m){
        dealDamageToMonster(m, p.damage, p.elem||null, false);
        if(p.status){
          const sts = Array.isArray(p.status) ? p.status : [p.status];
          for(const st of sts){ tryApplyStatus(m, st, st.elem); }
        }
        if(p.ls>0){ const heal=Math.max(1,Math.floor(p.damage*p.ls/100)); player.hp=Math.min(player.hpMax, player.hp+heal); addDamageText(player.x,player.y,`+${heal}`,'#76d38b'); }
        if(p.md>0){ const gain=Math.max(1,Math.floor(p.damage*p.md/100)); if(player.class==='mage'){ player.mp=Math.min(player.mpMax,player.mp+gain); } else { player.sp=Math.min(player.spMax,player.sp+gain); } addDamageText(player.x,player.y,`+${gain}`,'#4aa3ff'); updateResourceUI(); }
        if(p.kb>0){
          const kdx=Math.sign(p.dx), kdy=Math.sign(p.dy);
          for(let i=0;i<p.kb;i++){ if(!tryMoveMonster(m,kdx,kdy)) break; }
        }
        if(p.pierce>0){ p.pierce--; }
        else{ p.alive=false; }
      }
    }
    // range limit
    if(p.maxDist && p.dist>=p.maxDist){ p.alive=false; }
  }
  // cleanup dead projectiles
  if(projectiles.length>64){ projectiles = projectiles.filter(p=>p.alive); }
}

// ===== Input =====
function handleKeyAction(key, e){
  if(key==='escape'){ if(!closeMenus()) toggleEscMenu(); return; }
  if(key==='i') toggleInv();
  if(key==='k'){
    if(player.class==='mage') toggleMagic();
    else toggleSkills();
  }
  if(key==='l') toggleSkills();
  if(key==='q'){
    if(player.class==='mage') castSelectedSpell();
    else castBoundSkill();
  }
  if(key==='c') toggleCharPage();
  if(key==='/') toggleActionLog();
  if(key==='e' && !e.repeat){
    if(player.x===stairs.x && player.y===stairs.y){
      player.floorsCleared++; player.score += SCORE_PER_FLOOR_CLEAR;
      floorNum++; player.score += SCORE_PER_FLOOR_REACHED * floorNum;
      seed=(seed*1664525+1013904223)|0; rng=new RNG(seed);
      generate(); hudFloor.textContent=floorNum; hudSeed.textContent=seed>>>0; showToast('Down we go'); toggleShop(false);
      updateScoreUI();
    } else if(player.x===merchant.x && player.y===merchant.y){
      toggleShop(document.getElementById('shop').style.display!=='block'); renderShop();
    }
  }
  if(key==='1'||key==='2'||key==='3'){
    const idx = parseInt(key,10)-1;
    const it = inventory.potionBag[idx];
    if(it){
      usePotion(it);
      inventory.potionBag[idx]=null;
      const panel=document.getElementById('inventory');
      if(panel && panel.style.display==='block') redrawInventory();
    }
  }
  if(key==='f'){
    const panel=document.getElementById('inventory');
    if(panel && panel.style.display==='block'){
      const det=document.getElementById('invDetails');
      const sel=det?.dataset.sel;
      const kind=det?.dataset.kind;
      if(sel && kind){
        if(kind==='bag') sellFromBag(parseInt(sel,10));
        else if(kind==='pbag') sellFromPotionBag(parseInt(sel,10));
        else if(kind==='eq') unequipAndSell(sel);
      }
    }
  }
  if(key==='-'){
    zoom = Math.max(0.5, zoom - 0.1);
  }
  if(key==='=' || key==='+'){
    zoom = Math.min(2, zoom + 0.1);
  }
  if(e.code==='Space'){
    performPlayerAttack(player.faceDx, player.faceDy);
  }
}

// ===== Inventory UI (toggle only) =====
function updatePaused(){
  const inv=document.getElementById('inventory');
  const magic=document.getElementById('magic');
  const skills=document.getElementById('skills');
  const esc=document.getElementById('escMenu');
  const charP=document.getElementById('charPage');
  const log=document.getElementById('actionLog');
  paused=(inv&&inv.style.display==='block')||(magic&&magic.style.display==='block')||(skills&&skills.style.display==='block')||(esc&&esc.style.display==='grid')||(charP&&charP.style.display==='block')||(log&&log.style.display==='block');
}

function toggleInv(){ let panel=document.getElementById('inventory'); if(!panel){ redrawInventory(); panel=document.getElementById('inventory'); } if(!panel) return; const show=panel.style.display===''||panel.style.display==='none'; panel.style.display=show?'block':'none'; if(show) redrawInventory(); updatePaused(); }

function renderCharPage(){
  const panel=document.getElementById('charPage');
  if(!panel) return;
  let html='<div class="section-title">Character</div>';
  html+=`<div class="kv">Class: <b>${skillTrees[player.class].name}</b></div>`;
  html+=`<div class="kv">HP: <b>${player.hp}/${player.hpMax}</b></div>`;
  html+=`<div class="kv">${player.class==='mage'?'Mana':'Stamina'}: <b>${player.class==='mage'?player.mp+'/'+player.mpMax:player.sp+'/'+player.spMax}</b></div>`;
  html+=`<div class="kv">Attack: <b>${currentStats.dmgMin}-${currentStats.dmgMax}</b></div>`;
  html+=`<div class="kv">Armor: <b>${currentStats.armor}</b></div>`;
  html+=`<div class="kv">Fire Res: <b>${player.resFire||0}%</b></div>`;
  html+=`<div class="kv">Ice Res: <b>${player.resIce||0}%</b></div>`;
  html+=`<div class="kv">Shock Res: <b>${player.resShock||0}%</b></div>`;
  html+=`<div class="kv">Magic Res: <b>${player.resMagic||0}%</b></div>`;
  panel.innerHTML=html;
}

function toggleCharPage(){
  const panel=document.getElementById('charPage');
  if(!panel) return;
  const show=panel.style.display===''||panel.style.display==='none';
  panel.style.display=show?'block':'none';
  if(show) renderCharPage();
  updatePaused();
}


function closeMenus(){
  let closed=false;
  const inv=document.getElementById('inventory');
  if(inv && inv.style.display==='block'){ toggleInv(); closed=true; }
  const shop=document.getElementById('shop');
  if(shop && shop.style.display==='block'){ toggleShop(false); closed=true; }
  const charP=document.getElementById('charPage');
  if(charP && charP.style.display==='block'){ toggleCharPage(); closed=true; }
  const magic=document.getElementById('magic');
  if(magic && magic.style.display==='block'){ toggleMagic(); closed=true; }
  const skills=document.getElementById('skills');
  if(skills && skills.style.display==='block'){ toggleSkills(); closed=true; }
  const log=document.getElementById('actionLog');
  if(log && log.style.display==='block'){ toggleActionLog(); closed=true; }
  const esc=document.getElementById('escMenu');
  if(esc && esc.style.display==='grid'){ toggleEscMenu(false); closed=true; }
  if(closed) updatePaused();
  return closed;
}

function redrawMagic(){
  let panel=document.getElementById('magic');
  if(!panel){ panel=document.createElement('div'); panel.id='magic'; panel.className='panel'; document.body.appendChild(panel); }
  let html = `<div class="section-title">Magic Points: ${player.magicPoints}</div>`;
  for(const treeName of ['healing','damage','dot']){
    const tree=magicTrees[treeName];
    html += `<div class="section-title">${tree.display}</div><div>`;
    tree.abilities.forEach((ab,i)=>{
      const unlocked=player.magic[treeName][i];
      const bind = player.boundSpell && player.boundSpell.tree===treeName && player.boundSpell.idx===i;
      if(unlocked){
        html += `<div class="list-row"><div>${ab.name}</div><div>${bind?'<span class="green">Bound</span>':`<button class="btn sml" data-bind="${treeName}-${i}">Bind</button>`}</div></div>`;
      }else{
        const prevUnlocked = i===0 || player.magic[treeName][i-1];
        const dis = (player.magicPoints<ab.cost || !prevUnlocked)?'disabled':'';
        html += `<div class="list-row"><div>${ab.name}</div><div><button class="btn sml" data-unlock="${treeName}-${i}" ${dis}>Unlock (${ab.cost})</button></div></div>`;
      }
    });
    html += '</div>';
  }
  panel.innerHTML = html;
  panel.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.unlock){
      const [t,i]=b.dataset.unlock.split('-'); unlockSpell(t,parseInt(i,10)); redrawMagic();
    }
    if(b.dataset.bind){
      const [t,i]=b.dataset.bind.split('-'); bindSpell(t,parseInt(i,10)); redrawMagic();
    }
  };
}

function toggleMagic(){ if(player.class!=='mage') return; let panel=document.getElementById('magic'); if(!panel){ redrawMagic(); panel=document.getElementById('magic'); } if(!panel) return; const show=panel.style.display===''||panel.style.display==='none'; panel.style.display=show?'block':'none'; if(show) redrawMagic(); updatePaused(); }

function redrawSkills(){
  if(player.class!=='warrior' && player.class!=='rogue') return;
  let panel=document.getElementById('skills');
  if(!panel){ panel=document.createElement('div'); panel.id='skills'; panel.className='panel'; document.body.appendChild(panel); }
  let html = `<div class="section-title">Skill Points: ${player.skillPoints}</div>`;
  for(const [treeName, tree] of Object.entries(skillTrees)){
    if(tree.class && tree.class!==player.class) continue;
    html += `<div class="section-title">${tree.display}</div><div>`;
    tree.abilities.forEach((ab,i)=>{
      const unlocked=player.skills[treeName][i];
      const bind = player.boundSkill && player.boundSkill.tree===treeName && player.boundSkill.idx===i;
      if(unlocked){
        if(ab.cast){
          html += `<div class="list-row"><div>${ab.name}<div class="muted">${ab.desc}</div></div><div>${bind?'<span class="green">Bound</span>':`<button class="btn sml" data-bind="${treeName}-${i}">Bind</button>`}</div></div>`;
        }else{
          html += `<div class="list-row"><div>${ab.name}<div class="muted">${ab.desc}</div></div><div><span class="green">Unlocked</span></div></div>`;
        }
      }else{
        const prevUnlocked = i===0 || player.skills[treeName][i-1];
        const dis=(player.skillPoints<ab.cost || !prevUnlocked)?'disabled':'';
        html += `<div class="list-row"><div>${ab.name}<div class="muted">${ab.desc}</div></div><div><button class="btn sml" data-unlock="${treeName}-${i}" ${dis}>Unlock (${ab.cost})</button></div></div>`;
      }
    });
    html += '</div>';
  }
  panel.innerHTML=html;
  panel.onclick=(e)=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.unlock){ const [t,i]=b.dataset.unlock.split('-'); unlockSkill(t,parseInt(i,10)); redrawSkills(); }
    if(b.dataset.bind){ const [t,i]=b.dataset.bind.split('-'); bindSkill(t,parseInt(i,10)); redrawSkills(); }
  };
}

function toggleSkills(){ if(player.class!=='warrior' && player.class!=='rogue') return; let panel=document.getElementById('skills'); if(!panel){ redrawSkills(); panel=document.getElementById('skills'); } if(!panel) return; const show=panel.style.display===''||panel.style.display==='none'; panel.style.display=show?'block':'none'; if(show) redrawSkills(); updatePaused(); }

function unlockSkill(treeName, idx){
  const ab=skillTrees[treeName].abilities[idx];
  if(player.skills[treeName][idx]) return;
  if(idx>0 && !player.skills[treeName][idx-1]){ showToast('Unlock previous ability first'); return; }
  if(player.skillPoints>=ab.cost){ player.skillPoints-=ab.cost; player.skills[treeName][idx]=true; showToast(`Unlocked ${ab.name}`); recalcStats(); }
  else showToast('Not enough points');
}

function bindSkill(treeName, idx){
  if(!player.skills[treeName][idx]){ showToast('Ability not unlocked'); return; }
  player.boundSkill={tree:treeName, idx};
  const ab=skillTrees[treeName].abilities[idx];
  hudSpell.textContent=ab.name;
  showToast(`Bound ${ab.name} to Q`);
}

function unlockSpell(treeName, idx){
  const ab=magicTrees[treeName].abilities[idx];
  if(player.magic[treeName][idx]) return;
  if(idx>0 && !player.magic[treeName][idx-1]){ showToast('Unlock previous ability first'); return; }
  if(player.magicPoints>=ab.cost){ player.magicPoints-=ab.cost; player.magic[treeName][idx]=true; showToast(`Unlocked ${ab.name}`); }
  else showToast('Not enough points');
}

function bindSpell(treeName, idx){
  if(!player.magic[treeName][idx]){ showToast('Ability not unlocked'); return; }
  player.boundSpell={tree:treeName, idx};
  const ab=magicTrees[treeName].abilities[idx];
  hudSpell.textContent=ab.name;
  updatePlayerSprite();
  showToast(`Bound ${ab.name} to Q`);
}

function castSelectedSpell(){
  const b=player.boundSpell; if(!b){ showToast('No spell bound'); return; }
  const ab=magicTrees[b.tree].abilities[b.idx];
  if(!player.magic[b.tree][b.idx]){ showToast('Spell locked'); return; }
  if(player.mp<ab.mp){ showToast('Not enough mana'); return; }
  player.mp-=ab.mp; updateResourceUI();
  if(ab.type==='heal'){
    const amt=ab.value===null?player.hpMax:ab.value;
    const heal=Math.min(amt, player.hpMax-player.hp);
    player.hp+=heal; hpFill.style.width=`${(player.hp/player.hpMax)*100}%`; hpLbl.textContent=`HP ${player.hp}/${player.hpMax}`; addDamageText(player.x,player.y,'+'+heal,'#76d38b');
    return;
  }
  const px = player.rx!==undefined?player.rx:player.x, py = player.ry!==undefined?player.ry:player.y;
  const mx = mouseX/zoom + camX;
  const my = mouseY/zoom + camY;
  let dx = mx - (px*TILE + TILE/2), dy = my - (py*TILE + TILE/2);
  if(dx===0 && dy===0){ dx = player.faceDx; dy = player.faceDy; }
  const mag = Math.hypot(dx, dy);
  if(mag===0){ showToast('Face a direction'); return; }
  dx/=mag; dy/=mag; player.faceDx=dx; player.faceDy=dy;
  const dmg = (ab.dmg||0)*(1+(player.spellBonus||0));
  projectiles.push({x:player.x+0.5,y:player.y+0.5,dx,dy,speed:12,damage:dmg,type:'magic',elem:ab.elem||null,owner:'player',alive:true,maxDist:ab.range||8,dist:0,status:ab.status||null});
}

function castBoundSkill(){
  const b=player.boundSkill; if(!b){ showToast('No skill bound'); return; }
  const ab=skillTrees[b.tree].abilities[b.idx];
  if(!player.skills[b.tree][b.idx]){ showToast('Skill locked'); return; }
  if(ab.cast==='powerStrike') castPowerStrike();
  else if(ab.cast==='whirlwind') castWhirlwind();
  else if(ab.cast==='shieldBash') castShieldBash();
  else if(ab.cast==='poisonStrike') castPoisonStrike();
  else if(ab.cast==='vanish') castVanish();
}

function castPowerStrike(){
  const cost=20;
  if(player.sp<cost){ showToast('Not enough stamina'); return; }
  player.sp-=cost; updateResourceUI();
  performPlayerAttack(player.faceDx, player.faceDy, 1.4);
}

function castWhirlwind(){
  const cost=30;
  if(player.sp<cost){ showToast('Not enough stamina'); return; }
  if(player.atkCD>0) return;
  player.sp-=cost; updateResourceUI();
  const {min,max,crit,ls,md} = currentAtk();
  const prof=currentWeaponProfile();
  let hit=false;
  for(const m of monsters){
    const dist=Math.hypot(m.x-player.x, m.y-player.y);
    if(dist<=1.5){
      let dmg=rng.int(min,max);
      const wasCrit=Math.random()*100<crit; if(wasCrit) dmg=Math.floor(dmg*1.5);
      dmg=Math.floor(dmg*1.6);
      dealDamageToMonster(m,dmg,null,wasCrit);
      if(ls>0){ const heal=Math.max(1,Math.floor(dmg*ls/100)); player.hp=Math.min(player.hpMax,player.hp+heal); addDamageText(player.x,player.y,`+${heal}`,'#76d38b'); }
      if(md>0){ const gain=Math.max(1,Math.floor(dmg*md/100)); if(player.class==='mage'){ player.mp=Math.min(player.mpMax,player.mp+gain); } else { player.sp=Math.min(player.spMax,player.sp+gain); } addDamageText(player.x,player.y,`+${gain}`,'#4aa3ff'); updateResourceUI(); }
      hit=true;
    }
  }
  if(hit) playAttack();
  player.atkCD = prof.cooldown*1.5;
}

function castShieldBash(){
  const cost=15;
  if(player.sp<cost){ showToast('Not enough stamina'); return; }
  if(player.atkCD>0) return;
  player.sp-=cost; updateResourceUI();
  const {min,max,crit,ls,md}=currentAtk();
  const prof=currentWeaponProfile();
  let dmg=rng.int(min,max);
  const wasCrit=Math.random()*100<crit; if(wasCrit) dmg=Math.floor(dmg*1.5);
  dmg=Math.floor(dmg*1.8);
  const reach=prof.reach ?? 2;
  const cone=(prof.cone || 35) * Math.PI/180;
  const ndx=player.faceDx, ndy=player.faceDy;
  let target=null,bestDist=Infinity;
  for(const m of monsters){
    const dxm=m.x-player.x, dym=m.y-player.y;
    const dist=Math.hypot(dxm,dym);
    if(dist>reach || dist===0) continue;
    const ang=Math.acos((ndx*dxm+ndy*dym)/dist);
    if(ang>cone/2) continue;
    if(!clearPath8(player.x,player.y,m.x,m.y)) continue;
    if(dist<bestDist){ target=m; bestDist=dist; }
  }
  if(target){
    dealDamageToMonster(target,dmg,null,wasCrit);
    tryApplyStatus(target,{k:'shock',dur:1200,power:0.5,chance:1},'shock');
    if(ls>0){ const heal=Math.max(1,Math.floor(dmg*ls/100)); player.hp=Math.min(player.hpMax,player.hp+heal); addDamageText(player.x,player.y,`+${heal}`,'#76d38b'); }
    if(md>0){ const gain=Math.max(1,Math.floor(dmg*md/100)); if(player.class==='mage'){ player.mp=Math.min(player.mpMax,player.mp+gain); } else { player.sp=Math.min(player.spMax,player.sp+gain); } addDamageText(player.x,player.y,`+${gain}`,'#4aa3ff'); updateResourceUI(); }
    playAttack();
  }
  player.atkCD = prof.cooldown;
}

function castPoisonStrike(){
  const cost=20;
  if(player.sp<cost){ showToast('Not enough stamina'); return; }
  if(player.atkCD>0) return;
  player.sp-=cost; updateResourceUI();
  const {min,max,crit,ls,md}=currentAtk();
  const prof=currentWeaponProfile();
  let dmg=rng.int(min,max);
  const wasCrit=Math.random()*100<crit; if(wasCrit) dmg=Math.floor(dmg*1.5);
  dmg=Math.floor(dmg*1.4);
  const reach=prof.reach ?? 2;
  const cone=(prof.cone || 35) * Math.PI/180;
  const ndx=player.faceDx, ndy=player.faceDy;
  let target=null,bestDist=Infinity;
  for(const m of monsters){
    const dxm=m.x-player.x, dym=m.y-player.y;
    const dist=Math.hypot(dxm,dym);
    if(dist>reach || dist===0) continue;
    const ang=Math.acos((ndx*dxm+ndy*dym)/dist);
    if(ang>cone/2) continue;
    if(!clearPath8(player.x,player.y,m.x,m.y)) continue;
    if(dist<bestDist){ target=m; bestDist=dist; }
  }
  if(target){
    dealDamageToMonster(target,dmg,null,wasCrit);
    tryApplyStatus(target,{k:'poison',dur:3000,power:1.0,chance:1},'poison');
    if(ls>0){ const heal=Math.max(1,Math.floor(dmg*ls/100)); player.hp=Math.min(player.hpMax,player.hp+heal); addDamageText(player.x,player.y,`+${heal}`,'#76d38b'); }
    if(md>0){ const gain=Math.max(1,Math.floor(dmg*md/100)); if(player.class==='mage'){ player.mp=Math.min(player.mpMax,player.mp+gain); } else { player.sp=Math.min(player.spMax,player.sp+gain); } addDamageText(player.x,player.y,`+${gain}`,'#4aa3ff'); updateResourceUI(); }
    playAttack();
  }
  player.atkCD = prof.cooldown;
}

function castVanish(){
  const cost=25;
  if(player.sp<cost){ showToast('Not enough stamina'); return; }
  player.sp-=cost; updateResourceUI();
  applyStatus(player,'invis',4000);
  // Instantly disengage from combat so the rogue can heal while invisible
  player.combatTimer = OUT_OF_COMBAT_HEAL_DELAY;
  player.healAcc = 0;
}

function toggleEscMenu(force){
  const menu=document.getElementById('escMenu'); if(!menu) return;
  const show=typeof force==='boolean'?force:(menu.style.display===''||menu.style.display==='none');
  menu.style.display=show?'grid':'none';
  updatePaused();
}

function saveGame(){
  // Persist only the essentials needed to resume later
  const data={
    floorNum,
    player:{ class:player.class, lvl:player.lvl, gold:player.gold },
    equip: inventory.equip
  };
  try{ localStorage.setItem('dungeonSave', JSON.stringify(data)); showToast('Game saved'); }
  catch(e){ console.warn('Save failed', e); }
}

function loadGame(){
  const raw=localStorage.getItem('dungeonSave'); if(!raw){ showToast('No saved game'); return; }
  const data=JSON.parse(raw);
  floorNum=data.floorNum||1;
  // new map each load — seed does not need to persist
  seed=(Math.random()*1e9)|0; rng=new RNG(seed);
  generate();
  const saved=data.player||{};
  player.class=saved.class||'warrior';
  player.lvl=saved.lvl||1;
  player.gold=saved.gold||0;
  player.score=0; player.kills=0; player.timeSurvived=0; player.floorsCleared=0;
  updatePlayerSprite();
  inventory.bag=new Array(BAG_SIZE).fill(null);
  inventory.potionBag=new Array(POTION_BAG_SIZE).fill(null);
  inventory.equip=data.equip||{helmet:null,chest:null,legs:null,hands:null,feet:null,weapon:null};
  hudFloor.textContent=floorNum; hudSeed.textContent=seed>>>0; hudGold.textContent=player.gold; hudLvl.textContent=player.lvl;
  player.rx=player.x; player.ry=player.y; player.fromX=player.x; player.fromY=player.y; player.toX=player.x; player.toY=player.y; player.moving=false; player.moveT=1;
  recalcStats();
  player.hp=player.hpMax;
  if(player.class==='mage') player.mp=player.mpMax; else player.sp=player.spMax;
  recomputeFOV(); redrawInventory();
  hudAbilityLabel.textContent = player.class==='mage'?'Spell:':'Skill:';
  hudSpell.textContent = player.class==='mage'
    ? (player.boundSpell ? magicTrees[player.boundSpell.tree].abilities[player.boundSpell.idx].name : 'None')
    : (player.boundSkill ? skillTrees[player.boundSkill.tree].abilities[player.boundSkill.idx].name : 'None');
  updateResourceUI();
  updateScoreUI();
  toggleEscMenu(false); showToast('Game loaded');
}

// ===== Loot helpers =====
function dropItemNear(x, y, makeItem, includeCenter=true){
  const dirs=shuffle([[0,0],[1,0],[-1,0],[0,1],[0,-1]]);
  for(const [dx,dy] of dirs){
    if(!includeCenter && dx===0 && dy===0) continue;
    const nx=x+dx, ny=y+dy;
    if(!walkable(nx,ny)) continue;
    const key=`${nx},${ny}`;
    if(lootMap.has(key)) continue;
    if(monsters.some(mm=>mm.x===nx && mm.y===ny)) continue;
    if(nx===player.x && ny===player.y) continue;
    if(nx===merchant.x && ny===merchant.y) continue;
    lootMap.set(key, makeItem());
    return true;
  }
  return false;
}

function dropGearNear(x,y){
  return dropItemNear(x,y, makeRandomGear, false);
}

function dropLoot(x,y){
  const gen = rng.next()<0.25 ? makeRandomPotion : makeRandomGear;
  dropItemNear(x,y, gen, true);
}

// ===== XP / Leveling =====
function calcMonsterXP(m){
  const avgDmg = (m.dmgMin + m.dmgMax) / 2;
  const difficulty = m.hpMax + avgDmg * 10;
  return Math.round(difficulty * 0.25);
}
function grantXP(x){
  player.xp += Math.round(x * XP_GAIN_MULT);
  while(player.xp>=player.xpToNext){ player.xp-=player.xpToNext; levelUp(); }
}
function levelUp(){
  player.lvl++;
  player.baseAtkBonus += 1;
  player.xpToNext = Math.floor(50*Math.pow(1.35, player.lvl-1));
  if(player.class==='mage') player.magicPoints++;
  else player.skillPoints++;
  recalcStats();
  player.hp = player.hpMax;
  if(player.class==='mage') player.mp = player.mpMax;
  else player.sp = player.spMax;
  hpFill.style.width = `${(player.hp/player.hpMax)*100}%`;
  updateResourceUI();
  updateXPUI();
  hpLbl.textContent = `HP ${player.hp}/${player.hpMax}`;
  showToast(`Level up! Lv ${player.lvl}`);
  showToast(player.class==='mage'?'Gained magic point':'Gained skill point');
}

// ===== Toast =====

// ===== Stats =====
function baseStats(){
  const lvl = player.lvl;
  const hpGainPerLevel = 20;
  const mpGainPerLevel = player.class==='mage'?12:8;
  const spGainPerLevel = player.class==='rogue'?12:8;
  return {
    dmgMin:2, dmgMax:4, crit:5, armor:5 + (lvl-1)*2, armorPct:0,
    hpMax:150 + (lvl-1)*hpGainPerLevel,
    mpMax:60 + (lvl-1)*mpGainPerLevel,
    spMax:60 + (lvl-1)*spGainPerLevel,
    speedPct:0,
    resF:0,resI:0,resS:0,resM:0,resP:0,
    spellBonus:0
  };
}

function applyClassBonuses(stats){
  if(player.class==='warrior'){
    stats.hpMax += 40; stats.spMax += 40; stats.dmgMin += 2; stats.dmgMax += 2; stats.armor += 5;
  }else if(player.class==='mage'){
    stats.mpMax += 40; stats.hpMax += 20; stats.spellBonus = 0.2; stats.armor += 1;
  }else if(player.class==='rogue'){
    stats.spMax += 60; stats.hpMax += 10; stats.dmgMin += 1; stats.dmgMax += 1; stats.crit += 10; stats.speedPct += 10; stats.armor += 3;
  }
}

function applyLevelBonuses(stats){
  const lvlBonus = Math.floor((player.lvl-1)*0.6) + (player.baseAtkBonus||0);
  stats.dmgMin += lvlBonus; stats.dmgMax += lvlBonus;
  const baseRes = Math.floor((player.lvl-1)*1.5);
  stats.resF += baseRes; stats.resI += baseRes; stats.resS += baseRes; stats.resM += baseRes; stats.resP += baseRes;
}

function accumulate(stats, mods, factor = 1){
  for(const k in mods){
    if(k==='mpMax'){
      const val = Math.round(mods.mpMax * factor);
      stats.mpMax += val; stats.spMax += val;
    }
    else if(k==='hpMax'){ stats.hpMax += Math.round(mods.hpMax * factor); }
    else if(k==='spMax'){ stats.spMax += Math.round(mods.spMax * factor); }
    else if(k==='resFire'){ stats.resF += mods.resFire; }
    else if(k==='resIce'){ stats.resI += mods.resIce; }
    else if(k==='resShock'){ stats.resS += mods.resShock; }
    else if(k==='resMagic'){ stats.resM += mods.resMagic; }
    else if(k==='resPoison'){ stats.resP += mods.resPoison; }
    else if(k==='armorPct'){ stats.armorPct = (stats.armorPct||0) + mods.armorPct; }
    else if(k in stats){ stats[k] += mods[k]; }
  }
}

function applyGearBonuses(stats){
  const levelFactor = 1 + player.lvl * 0.05;
  for(const slot of SLOTS){
    const it=inventory.equip[slot]; if(!it) continue;
    accumulate(stats, it.mods, levelFactor);
  }
}

function applySkillBonuses(stats){
  for(const treeName in skillTrees){
    const tree=skillTrees[treeName];
    if(tree.class && tree.class!==player.class) continue;
    const arr=player.skills[treeName]||[];
    arr.forEach((u,i)=>{
      if(!u) return;
      const b=skillTrees[treeName].abilities[i].bonus||{};
      accumulate(stats, b);
    });
  }
}

function recalcStats(){
  const stats=baseStats();
  applyClassBonuses(stats);
  applyLevelBonuses(stats);
  applyGearBonuses(stats);
  applySkillBonuses(stats);

  if(stats.armorPct) stats.armor = Math.round(stats.armor * (1 + stats.armorPct/100));
  player.hpMax=stats.hpMax; player.mpMax=stats.mpMax; player.spMax=stats.spMax;
  player.speedPct=stats.speedPct; player.spellBonus=stats.spellBonus;
  if(player.hp>stats.hpMax) player.hp=stats.hpMax; if(player.mp>stats.mpMax) player.mp=stats.mpMax; if(player.sp>stats.spMax) player.sp=stats.spMax;
  player.armor = stats.armor;
  player.resFire=stats.resF; player.resIce=stats.resI; player.resShock=stats.resS; player.resMagic=stats.resM; player.resPoison=stats.resP;
  currentStats={dmgMin:stats.dmgMin,dmgMax:stats.dmgMax,crit:stats.crit,armor:stats.armor,resF:stats.resF,resI:stats.resI,resS:stats.resS,resM:stats.resM,resP:stats.resP,hpMax:stats.hpMax,mpMax:stats.mpMax,spMax:stats.spMax};
  hudDmg.textContent = `ATK ${stats.dmgMin}-${stats.dmgMax} | CRIT ${stats.crit}% | ARM ${stats.armor} | RES F/I/S/M/P ${stats.resF}/${stats.resI}/${stats.resS}/${stats.resM}/${stats.resP}`;
  hpFill.style.width = `${(player.hp/player.hpMax)*100}%`;
  updateResourceUI();
  hpLbl.textContent = `HP ${player.hp}/${player.hpMax}`;
}

// ===== Main Loop =====
// main loop handled by modules/loop.js

// ===== Start =====
function startGame(){
  initAudio();
  initInput(handleKeyAction);
  gameOver = false;
  paused = false;
  for(const k in keys){ keys[k] = false; }
  // class pick -> sprite & stats
  const cSel = document.querySelector('input[name="class"]:checked');
  player.class = cSel ? cSel.value : 'warrior';
  player.boundSpell=null; player.boundSkill=null;
  updatePlayerSprite();
  player.score=0; player.kills=0; player.timeSurvived=0; player.floorsCleared=0; scoreUpdateTimer=0; updateScoreUI();
  hudAbilityLabel.textContent = player.class==='mage'?'Spell:':'Skill:';
  hudFloor.textContent=floorNum; hudSeed.textContent=seed>>>0; hudGold.textContent=player.gold; hudLvl.textContent=player.lvl;
  generate(); recalcStats();
  player.hp = player.hpMax;
  if(player.class==='mage') player.mp = player.mpMax; else player.sp = player.spMax;
  hpFill.style.width = `100%`; updateResourceUI();
  hpLbl.textContent = `HP ${player.hp}/${player.hpMax}`;
  recomputeFOV();
  hudSpell.textContent = player.class==='mage'
    ? (player.boundSpell ? magicTrees[player.boundSpell.tree].abilities[player.boundSpell.idx].name : 'None')
    : (player.boundSkill ? skillTrees[player.boundSkill.tree].abilities[player.boundSkill.idx].name : 'None');
  const smoothToggle=document.getElementById('smoothToggle'); const speedRange=document.getElementById('speedRange');
  if(smoothToggle){ smoothToggle.checked = smoothEnabled; smoothToggle.addEventListener('change', e=>{ smoothEnabled = e.target.checked; if(!smoothEnabled){ player.rx=player.x; player.ry=player.y; } }); }
  if(speedRange){ baseStepDelay = player.stepDelay; speedRange.value = String(baseStepDelay); speedRange.addEventListener('input', e=>{ const v=parseInt(e.target.value,10); if(!isNaN(v)) baseStepDelay=v; }); }
  startLoop(update, draw);
}

// Setup UI events once the DOM is ready so buttons work reliably
window.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.addEventListener('click', () => {
    const startScreen = document.getElementById('start');
    if (startScreen) startScreen.style.display = 'none';
    startGame();
  });

  const respawnBtn = document.getElementById('respawnBtn');
  if (respawnBtn) respawnBtn.addEventListener('click', () => location.reload());

  const resumeBtn = document.getElementById('resumeBtn');
  if (resumeBtn) resumeBtn.addEventListener('click', () => toggleEscMenu(false));

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveGame);

  const loadBtn = document.getElementById('loadBtn');
  if (loadBtn) loadBtn.addEventListener('click', loadGame);
});

window.addEventListener('beforeunload', saveGame);

// ===== Utils =====
function clamp(a,b,x){ return Math.max(a, Math.min(b, x)); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
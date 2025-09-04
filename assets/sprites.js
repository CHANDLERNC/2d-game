// procedural floor and wall textures (no external assets)
// generate a set of stone floor tiles with subtle crack variations
function makeFloorTiles(count = 16) {
  const tiles = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    // base stone color and border
    g.fillStyle = '#5c5d60';
    g.fillRect(0, 0, 32, 32);
    g.strokeStyle = '#2f3033';
    g.lineWidth = 2;
    g.strokeRect(0, 0, 32, 32);

    // inner lighter area
    g.fillStyle = '#6d6e72';
    g.fillRect(2, 2, 28, 28);

    // deterministic pseudo-random cracks
    let s = i * 1234567;
    function rnd() {
      s = (s * 1664525 + 1013904223) | 0;
      return (s >>> 0) / 4294967296;
    }
    g.strokeStyle = '#3c3d40';
    g.lineWidth = 1;
    const cracks = 2 + (rnd() * 3) | 0; // 2-4 cracks
    for (let j = 0; j < cracks; j++) {
      const sx = 4 + rnd() * 24;
      const sy = 4 + rnd() * 24;
      const ex = sx + (rnd() * 2 - 1) * 8;
      const ey = sy + (rnd() * 2 - 1) * 8;
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(ex, ey);
      g.stroke();
    }

    tiles.push(c);
  }
  return tiles;
}
// generate enough variations to include newly added patterns
const floorTiles = makeFloorTiles(32);
const wallTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 32, 32);
  g.strokeStyle = '#A9A9A9';
  g.lineWidth = 4;
  g.strokeRect(0, 0, 32, 32);
  return c;
})();

// Collect textures under a descriptive object so they can be tweaked from one place
const TEXTURES = {
  floorTiles,
  wall: wallTex,
};

// ====== Sprites (generated at runtime) ======
// why: generate pixel art once, store data URLs so everything stays single-file & offline
const SPRITES = {}; // key -> { cv }
function makeSprite(size, draw){ const c=document.createElement("canvas"); c.width=c.height=size; const g=c.getContext("2d"); g.imageSmoothingEnabled=false; draw(g,size); return { cv: c }; }
function px(g,x,y,w,h,col){ g.fillStyle=col; g.fillRect(x,y,w,h); }
function outline(g,size){ /* no outline to avoid black boxes */ }
function spriteFromB64Frames(size, arr){
  const frames = arr.map(src => {
    const img = new Image();
    img.src = src;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    img.onload = () => { g.clearRect(0,0,size,size); g.drawImage(img,0,0,size,size); };
    return c;
  });
  return { cv: frames[0], frames };
}
function genSprites(){
  // Warrior animation 24x24
  function makePlayerWarriorAnim(){
    function drawFrame(g, oy, step){
      // boots
      px(g,5,18+oy,14,3,'#4b3621');
      // legs
      px(g,6+step,14+oy,4,4,'#6b6b7d');
      px(g,14-step,14+oy,4,4,'#6b6b7d');
      // torso armor
      px(g,6,8+oy,12,6,'#8c8d9f');
      // shoulders
      px(g,5,8+oy,2,6,'#7a7b8c');
      px(g,17,8+oy,2,6,'#7a7b8c');
      // arms
      px(g,4-step,12+oy,2,4,'#c0c0c0');
      px(g,18+step,12+oy,2,4,'#c0c0c0');
      // head & helmet
      px(g,8,2+oy,8,6,'#e3c6a6');
      px(g,9,4+oy,2,2,'#000'); px(g,13,4+oy,2,2,'#000');
      px(g,7,1+oy,10,2,'#8c8d9f');
      px(g,7,2+oy,2,3,'#8c8d9f'); px(g,15,2+oy,2,3,'#8c8d9f');
      // sword
      px(g,20+step,8+oy,2,10,'#c0c0c0');
      px(g,19+step,17+oy,4,2,'#3a2d1a');
      outline(g,24);
    }
    const idle=[], move=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      drawFrame(g,i%2,0);
      idle.push(c);
    }
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      const step=(i<2?-1:1);
      drawFrame(g,i%2,step);
      move.push(c);
    }
    return { idle, move };
  }
  SPRITES.player_warrior = makePlayerWarriorAnim();

  // Mage animation 24x24
  function makePlayerMageAnim(robeCol, orbCol){
    function drawFrame(g, oy, step){
      // staff
      px(g,20+step,6+oy,2,12,'#8b5e3c');
      px(g,19+step,4+oy,4,4,orbCol);
      // boots
      px(g,7,18+oy,10,3,'#3a2d1a');
      // robe
      px(g,6,8+oy,12,10,robeCol);
      px(g,5,10+oy,2,8,robeCol);
      px(g,17,10+oy,2,8,robeCol);
      // arms
      px(g,4-step,10+oy,2,6,robeCol);
      px(g,18+step,10+oy,2,6,robeCol);
      // head & hood
      px(g,8,2+oy,8,6,'#e3c6a6');
      px(g,9,4+oy,2,2,'#000'); px(g,13,4+oy,2,2,'#000');
      px(g,7,1+oy,10,2,robeCol);
      px(g,6,2+oy,12,2,robeCol);
      outline(g,24);
    }
    const idle=[], move=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      drawFrame(g,i%2,0);
      idle.push(c);
    }
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      const step=(i<2?-1:1);
      drawFrame(g,i%2,step);
      move.push(c);
    }
    return { idle, move };
  }
  SPRITES.player_mage = makePlayerMageAnim('#4a3a8a','#b84aff');
  SPRITES.player_mage_fire = makePlayerMageAnim('#ff6b4a','#ff9b4a');
  SPRITES.player_mage_ice = makePlayerMageAnim('#7dd3fc','#bdeafe');
  SPRITES.player_mage_shock = makePlayerMageAnim('#facc15','#fde047');
  SPRITES.player_mage_poison = makePlayerMageAnim('#76d38b','#9fe2a1');
  SPRITES.player_summoner = SPRITES.player_mage;

  // Rogue animation 24x24
  function makePlayerRogueAnim(){
    function drawFrame(g, oy, step){
      // boots
      px(g,5,18+oy,14,3,'#2b2b2b');
      // legs
      px(g,6+step,14+oy,4,4,'#3a3a3a');
      px(g,14-step,14+oy,4,4,'#3a3a3a');
      // torso
      px(g,6,8+oy,12,6,'#555');
      // arms
      px(g,4-step,12+oy,2,4,'#c0c0c0');
      px(g,18+step,12+oy,2,4,'#c0c0c0');
      // head & hood
      px(g,8,2+oy,8,6,'#e3c6a6');
      px(g,9,4+oy,2,2,'#000'); px(g,13,4+oy,2,2,'#000');
      px(g,7,1+oy,10,2,'#3a3a3a');
      // dagger
      px(g,20+step,13+oy,2,5,'#c0c0c0');
      px(g,19+step,17+oy,4,2,'#6b4b2a');
      outline(g,24);
    }
    const idle=[], move=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      drawFrame(g,i%2,0);
      idle.push(c);
    }
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas'); c.width=c.height=24;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      const step=(i<2?-1:1);
      drawFrame(g,i%2,step);
      move.push(c);
    }
    return { idle, move };
  }
  SPRITES.player_rogue = makePlayerRogueAnim();

  // Slime animation frames loaded from external assets
  function loadSlimeAnim(tint){
    const frames = [];
    for(let i=0;i<4;i++){
      const img = new Image();
      img.src = `assets/Slime/Frames/Move/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,32,32);
        g.drawImage(img,0,0);
        if(tint){
          g.globalCompositeOperation = 'source-atop';
          g.fillStyle = tint;
          g.fillRect(0,0,32,32);
          g.globalCompositeOperation = 'source-over';
        }
      };
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.slime = loadSlimeAnim();
  SPRITES.slime_red = loadSlimeAnim('#ff6b4a');
  SPRITES.slime_yellow = loadSlimeAnim('#ffd24a');
  SPRITES.slime_blue = loadSlimeAnim('#7dd3fc');
  SPRITES.slime_purple = loadSlimeAnim('#b84aff');
  SPRITES.slime_shadow = loadSlimeAnim('#3a3a3a');

  // Rat animation frames loaded from external assets
  function loadRatAnim(){
    const idle = [], move = [], attack = [];
    // idle frames
    for(let i=0;i<5;i++){
      const img = new Image();
      img.src = `assets/Rat/Frames/Idle_rat_frames/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,32,32);
        g.drawImage(img,0,0);
      };
      idle.push(c);
    }
    // move frames
    for(let i=0;i<5;i++){
      const img = new Image();
      img.src = `assets/Rat/Frames/Move/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,32,32);
        g.drawImage(img,0,0);
      };
      move.push(c);
    }
    // attack frames
    for(let i=0;i<4;i++){
      const img = new Image();
      img.src = `assets/Rat/Frames/Attack/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,32,32);
        g.drawImage(img,0,0);
      };
      attack.push(c);
    }
    return { cv: idle[0], idle, move, attack, frames: move };
  }
  SPRITES.rat = loadRatAnim();

  // Coin loot 14x14 rotating animation
  function makeCoinAnim(){
    const frames = [];
    const steps = 8;
    for(let i=0;i<steps;i++){
      const c=document.createElement('canvas');
      c.width=c.height=14;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const t=i/steps*Math.PI*2;
      const rx=5*Math.abs(Math.cos(t))+1; // horizontal radius varies to simulate rotation
      const grad=g.createLinearGradient(7-rx,7,7+rx,7);
      grad.addColorStop(0,'#fff6b7');
      grad.addColorStop(0.5,'#ffd24a');
      grad.addColorStop(1,'#cc9a2b');
      g.fillStyle=grad;
      g.beginPath();
      g.ellipse(7,7,rx,6,0,0,Math.PI*2);
      g.fill();
      g.strokeStyle='#996515';
      g.lineWidth=1;
      g.beginPath();
      g.ellipse(7,7,rx,6,0,0,Math.PI*2);
      g.stroke();
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.coin = makeCoinAnim();

  // Lava tile animation 32x32
  function makeLavaAnim(){
    const frames=[];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=32;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      for(let y=0;y<32;y++){
        for(let x=0;x<32;x++){
          const v=Math.sin((x+i*2)/4)+Math.cos((y+i*2)/4);
          let col='#8b0000';
          if(v>1) col='#ffd700';
          else if(v>0.5) col='#ff8c00';
          else if(v>0) col='#d04000';
          g.fillStyle=col; g.fillRect(x,y,1,1);
        }
      }
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.lava = makeLavaAnim();

  // Spike trap animation 32x32
  function makeSpikeTrapAnim(){
    const frames=[]; const heights=[4,12,20,12];
    for(let i=0;i<heights.length;i++){
      const c=document.createElement('canvas');
      c.width=c.height=32;
      const g=c.getContext('2d'); g.imageSmoothingEnabled=false;
      g.clearRect(0,0,32,32);
      g.fillStyle='#222';
      g.fillRect(0,24,32,8);
      g.fillStyle='#bbb';
      g.strokeStyle='#555';
      const h=heights[i];
      for(let s=0;s<4;s++){
        const bx=4+s*8;
        g.beginPath();
        g.moveTo(bx,24);
        g.lineTo(bx+4,24);
        g.lineTo(bx+2,24-h);
        g.closePath();
        g.fill();
        g.stroke();
      }
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.spike = makeSpikeTrapAnim();

  // Potion sprites with simple rotation animation
  function makePotionAnim(svg){
    const img = new Image();
    const sprite = { cv: img, frames: [] };
    img.onload = () => {
      const steps = 8;
      for(let i=0;i<steps;i++){
        const c=document.createElement('canvas');
        c.width=c.height=12;
        const g=c.getContext('2d');
        g.imageSmoothingEnabled=false;
        const t=i/steps*Math.PI*2;
        const sx=Math.abs(Math.cos(t))*0.6+0.4; // scale 0.4–1.0
        g.setTransform(sx,0,0,1,6-6*sx,0);
        g.drawImage(img,0,0);
        sprite.frames.push(c);
      }
      sprite.cv=sprite.frames[0];
    };
    img.src = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
    return sprite;
  }

  function makeSpinAnim(svg){
    const img = new Image();
    const sprite = { cv: img, frames: [] };
    img.onload = () => {
      const steps = 16;
      for(let i=0;i<steps;i++){
        const c=document.createElement('canvas');
        c.width=c.height=14;
        const g=c.getContext('2d');
        g.imageSmoothingEnabled=false;
        g.translate(7,7);
        g.rotate(i/steps*Math.PI*2);
        g.drawImage(img,-6,-6);
        sprite.frames.push(c);
      }
      sprite.cv=sprite.frames[0];
    };
    img.src = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
    return sprite;
  }

  function makeIcon(svg, size = 14){
    const img = new Image();
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    img.onload = () => { g.clearRect(0,0,size,size); g.drawImage(img,0,0,size,size); };
    img.src = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'}));
    return { cv: c };
  }

  const hpPotionSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
  <!-- Palette -->
  <!-- O = outline #6b0018, B = body #d61a3c, H = highlight #ff9aaa, D = deep red #a10f28 -->

  <!-- y=0 -->
  <rect x="5" y="0" width="1" height="1" fill="#6b0018"/>

  <!-- y=1 -->
  <rect x="4" y="1" width="1" height="1" fill="#6b0018"/>
  <rect x="5" y="1" width="1" height="1" fill="#d61a3c"/>
  <rect x="6" y="1" width="1" height="1" fill="#6b0018"/>

  <!-- y=2 -->
  <rect x="3" y="2" width="1" height="1" fill="#6b0018"/>
  <rect x="4" y="2" width="1" height="1" fill="#d61a3c"/>
  <rect x="5" y="2" width="1" height="1" fill="#ff9aaa"/>
  <rect x="6" y="2" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="2" width="1" height="1" fill="#6b0018"/>

  <!-- y=3 -->
  <rect x="2" y="3" width="1" height="1" fill="#6b0018"/>
  <rect x="3" y="3" width="1" height="1" fill="#d61a3c"/>
  <rect x="4" y="3" width="1" height="1" fill="#ff9aaa"/>
  <rect x="5" y="3" width="1" height="1" fill="#d61a3c"/>
  <rect x="6" y="3" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="3" width="1" height="1" fill="#d61a3c"/>
  <rect x="8" y="3" width="1" height="1" fill="#6b0018"/>

  <!-- y=4 -->
  <rect x="1" y="4" width="1" height="1" fill="#6b0018"/>
  <rect x="2" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="3" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="4" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="5" y="4" width="1" height="1" fill="#ff9aaa"/>
  <rect x="6" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="8" y="4" width="1" height="1" fill="#d61a3c"/>
  <rect x="9" y="4" width="1" height="1" fill="#6b0018"/>

  <!-- y=5 -->
  <rect x="1" y="5" width="1" height="1" fill="#6b0018"/>
  <rect x="2" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="3" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="4" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="5" y="5" width="1" height="1" fill="#ff9aaa"/>
  <rect x="6" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="8" y="5" width="1" height="1" fill="#d61a3c"/>
  <rect x="9" y="5" width="1" height="1" fill="#6b0018"/>

  <!-- y=6 -->
  <rect x="2" y="6" width="1" height="1" fill="#6b0018"/>
  <rect x="3" y="6" width="1" height="1" fill="#d61a3c"/>
  <rect x="4" y="6" width="1" height="1" fill="#d61a3c"/>
  <rect x="5" y="6" width="1" height="1" fill="#d61a3c"/>
  <rect x="6" y="6" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="6" width="1" height="1" fill="#d61a3c"/>
  <rect x="8" y="6" width="1" height="1" fill="#6b0018"/>

  <!-- y=7 -->
  <rect x="3" y="7" width="1" height="1" fill="#6b0018"/>
  <rect x="4" y="7" width="1" height="1" fill="#d61a3c"/>
  <rect x="5" y="7" width="1" height="1" fill="#d61a3c"/>
  <rect x="6" y="7" width="1" height="1" fill="#d61a3c"/>
  <rect x="7" y="7" width="1" height="1" fill="#6b0018"/>

  <!-- y=8 -->
  <rect x="4" y="8" width="1" height="1" fill="#6b0018"/>
  <rect x="5" y="8" width="1" height="1" fill="#a10f28"/>
  <rect x="6" y="8" width="1" height="1" fill="#6b0018"/>

  <!-- y=9 -->
  <rect x="5" y="9" width="1" height="1" fill="#a10f28"/>

  <!-- y=10 -->
  <rect x="5" y="10" width="1" height="1" fill="#6b0018"/>

  <!-- y=11 -->
  <rect x="4" y="11" width="1" height="1" fill="#6b0018"/>
  <rect x="5" y="11" width="1" height="1" fill="#6b0018"/>
  <rect x="6" y="11" width="1" height="1" fill="#6b0018"/>
</svg>`;

  const mpPotionSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
  <!-- Palette: outline #0d2a5f, body #1f86ff, highlight #bfe3ff, deep #135bbf -->

  <!-- y=0 -->
  <rect x="5" y="0" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=1 -->
  <rect x="4" y="1" width="1" height="1" fill="#0d2a5f"/>
  <rect x="5" y="1" width="1" height="1" fill="#1f86ff"/>
  <rect x="6" y="1" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=2 -->
  <rect x="3" y="2" width="1" height="1" fill="#0d2a5f"/>
  <rect x="4" y="2" width="1" height="1" fill="#1f86ff"/>
  <rect x="5" y="2" width="1" height="1" fill="#bfe3ff"/>
  <rect x="6" y="2" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="2" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=3 -->
  <rect x="2" y="3" width="1" height="1" fill="#0d2a5f"/>
  <rect x="3" y="3" width="1" height="1" fill="#1f86ff"/>
  <rect x="4" y="3" width="1" height="1" fill="#bfe3ff"/>
  <rect x="5" y="3" width="1" height="1" fill="#1f86ff"/>
  <rect x="6" y="3" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="3" width="1" height="1" fill="#1f86ff"/>
  <rect x="8" y="3" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=4 -->
  <rect x="1" y="4" width="1" height="1" fill="#0d2a5f"/>
  <rect x="2" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="3" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="4" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="5" y="4" width="1" height="1" fill="#bfe3ff"/>
  <rect x="6" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="8" y="4" width="1" height="1" fill="#1f86ff"/>
  <rect x="9" y="4" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=5 -->
  <rect x="1" y="5" width="1" height="1" fill="#0d2a5f"/>
  <rect x="2" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="3" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="4" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="5" y="5" width="1" height="1" fill="#bfe3ff"/>
  <rect x="6" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="8" y="5" width="1" height="1" fill="#1f86ff"/>
  <rect x="9" y="5" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=6 -->
  <rect x="2" y="6" width="1" height="1" fill="#0d2a5f"/>
  <rect x="3" y="6" width="1" height="1" fill="#1f86ff"/>
  <rect x="4" y="6" width="1" height="1" fill="#1f86ff"/>
  <rect x="5" y="6" width="1" height="1" fill="#1f86ff"/>
  <rect x="6" y="6" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="6" width="1" height="1" fill="#1f86ff"/>
  <rect x="8" y="6" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=7 -->
  <rect x="3" y="7" width="1" height="1" fill="#0d2a5f"/>
  <rect x="4" y="7" width="1" height="1" fill="#1f86ff"/>
  <rect x="5" y="7" width="1" height="1" fill="#1f86ff"/>
  <rect x="6" y="7" width="1" height="1" fill="#1f86ff"/>
  <rect x="7" y="7" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=8 -->
  <rect x="4" y="8" width="1" height="1" fill="#0d2a5f"/>
  <rect x="5" y="8" width="1" height="1" fill="#135bbf"/>
  <rect x="6" y="8" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=9 -->
  <rect x="5" y="9" width="1" height="1" fill="#135bbf"/>

  <!-- y=10 -->
  <rect x="5" y="10" width="1" height="1" fill="#0d2a5f"/>

  <!-- y=11 -->
  <rect x="4" y="11" width="1" height="1" fill="#0d2a5f"/>
  <rect x="5" y="11" width="1" height="1" fill="#0d2a5f"/>
  <rect x="6" y="11" width="1" height="1" fill="#0d2a5f"/>
</svg>`;

  const bowLootSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <rect x="6" y="1" width="1" height="10" fill="#dcdcdc"/>
  <rect x="4" y="1" width="1" height="1" fill="#3a1c0a"/>
  <rect x="3" y="2" width="1" height="1" fill="#8b5a2b"/>
  <rect x="2" y="3" width="1" height="1" fill="#8b5a2b"/>
  <rect x="2" y="4" width="1" height="1" fill="#3a1c0a"/>
  <rect x="2" y="7" width="1" height="1" fill="#3a1c0a"/>
  <rect x="2" y="8" width="1" height="1" fill="#8b5a2b"/>
  <rect x="3" y="9" width="1" height="1" fill="#8b5a2b"/>
  <rect x="4" y="10" width="1" height="1" fill="#3a1c0a"/>
  <rect x="3" y="3" width="1" height="1" fill="#c78549"/>
  <rect x="3" y="8" width="1" height="1" fill="#c78549"/>
  <rect x="4" y="6" width="1" height="1" fill="#c78549"/>
  <rect x="7" y="1" width="1" height="1" fill="#3a1c0a"/>
  <rect x="8" y="2" width="1" height="1" fill="#8b5a2b"/>
  <rect x="9" y="3" width="1" height="1" fill="#8b5a2b"/>
  <rect x="9" y="4" width="1" height="1" fill="#3a1c0a"/>
  <rect x="9" y="7" width="1" height="1" fill="#3a1c0a"/>
  <rect x="9" y="8" width="1" height="1" fill="#8b5a2b"/>
  <rect x="8" y="9" width="1" height="1" fill="#8b5a2b"/>
  <rect x="7" y="10" width="1" height="1" fill="#3a1c0a"/>
  <rect x="8" y="3" width="1" height="1" fill="#c78549"/>
  <rect x="8" y="8" width="1" height="1" fill="#c78549"/>
  </svg>`;
  const swordLootSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <rect x="5" y="0" width="2" height="7" fill="#dcdcdc"/>
  <rect x="5" y="0" width="1" height="7" fill="#a0a0a0"/>
  <rect x="6" y="0" width="1" height="7" fill="#f8f8f8"/>
  <rect x="4" y="7" width="4" height="1" fill="#b8860b"/>
  <rect x="3" y="8" width="6" height="1" fill="#8b5a2b"/>
  <rect x="5" y="9" width="2" height="2" fill="#8b4513"/>
  <rect x="5" y="11" width="2" height="1" fill="#d2b48c"/>
  </svg>`;
  const chestLootSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="2" y="0" width="3" height="2" fill="#3a3b44"/>
    <rect x="7" y="0" width="3" height="2" fill="#3a3b44"/>
    <rect x="1" y="2" width="10" height="1" fill="#3a3b44"/>
    <rect x="1" y="3" width="1" height="8" fill="#3a3b44"/>
    <rect x="10" y="3" width="1" height="8" fill="#3a3b44"/>
    <rect x="2" y="10" width="8" height="1" fill="#3a3b44"/>
    <rect x="2" y="3" width="8" height="7" fill="#8c8d9f"/>
    <rect x="3" y="4" width="6" height="5" fill="#aeb0c0"/>
    <rect x="4" y="5" width="4" height="3" fill="#c5c6d5"/>
    <rect x="2" y="9" width="8" height="1" fill="#7a7b8c"/>
  </svg>`;

  SPRITES.potion_hp = makePotionAnim(hpPotionSVG);
  SPRITES.potion_mp = makePotionAnim(mpPotionSVG);
  SPRITES.bow_loot = makeSpinAnim(bowLootSVG);
  SPRITES.sword_loot = makeSpinAnim(swordLootSVG);
  SPRITES.chest_loot = makeSpinAnim(chestLootSVG);
  // Jewelry loot icons
  const ringLootSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <circle cx="6" cy="6" r="3" stroke="#dcdcdc" stroke-width="2" fill="none"/>
    <circle cx="6" cy="6" r="1" stroke="#f8f8f8" stroke-width="1" fill="none"/>
  </svg>`;
  const necklaceLootSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <path d="M2 3 Q6 8 10 3" stroke="#dcdcdc" stroke-width="2" fill="none"/>
    <circle cx="6" cy="8" r="2" stroke="#f8f8f8" stroke-width="1" fill="none"/>
  </svg>`;
  SPRITES.ring_loot = makeSpinAnim(ringLootSVG);
  SPRITES.necklace_loot = makeSpinAnim(necklaceLootSVG);
  // Static icons for inventory display
  SPRITES.icon_ring = makeIcon(ringLootSVG);
  SPRITES.icon_necklace = makeIcon(necklaceLootSVG);
  SPRITES.icon_chest = makeIcon(chestLootSVG);

  const chestVariants = ['bronze','silver','golden'];
  SPRITES.chests = {};
  for(const v of chestVariants){
    const closed = new Image();
    // Bust browser cache so updated art is always loaded
    closed.src = `assets/Static/${v}_chest_closed.png?v=1`;
    const open = new Image();
    open.src = `assets/Static/${v}_chest_open.png?v=1`;
    SPRITES.chests[v] = { closed, open };
  }

  // Barrels, crates and debris for breakable props
  const barrel = new Image();
  barrel.src = 'assets/Static/barrel.png';
  SPRITES.barrel = barrel;
  const crate = new Image();
  crate.src = 'assets/Static/crate.png';
  SPRITES.crate = crate;
  const crate2 = new Image();
  crate2.src = 'assets/Static/crate2.png';
  SPRITES.crate2 = crate2;
  const debris1 = new Image();
  debris1.src = 'assets/Static/debris1.png';
  const debris2 = new Image();
  debris2.src = 'assets/Static/debris2.png';
  SPRITES.debris = [debris1, debris2];

  const helmetSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="1" y="4" width="10" height="7" fill="#8c8d9f"/>
    <rect x="2" y="2" width="8" height="2" fill="#aeb0c0"/>
    <rect x="3" y="1" width="6" height="1" fill="#c5c6d5"/>
    <rect x="2" y="9" width="8" height="1" fill="#7a7b8c"/>
  </svg>`;
  const legsSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="2" y="0" width="3" height="11" fill="#8c8d9f"/>
    <rect x="7" y="0" width="3" height="11" fill="#8c8d9f"/>
    <rect x="2" y="5" width="3" height="6" fill="#aeb0c0"/>
    <rect x="7" y="5" width="3" height="6" fill="#aeb0c0"/>
    <rect x="2" y="10" width="3" height="1" fill="#7a7b8c"/>
    <rect x="7" y="10" width="3" height="1" fill="#7a7b8c"/>
  </svg>`;
  const handsSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <circle cx="4" cy="6" r="3" fill="#aeb0c0" stroke="#7a7b8c" stroke-width="1"/>
    <circle cx="8" cy="6" r="3" fill="#aeb0c0" stroke="#7a7b8c" stroke-width="1"/>
  </svg>`;
  const feetSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="2" y="7" width="3" height="3" fill="#8c8d9f"/>
    <rect x="7" y="7" width="3" height="3" fill="#8c8d9f"/>
    <rect x="2" y="10" width="3" height="1" fill="#7a7b8c"/>
    <rect x="7" y="10" width="3" height="1" fill="#7a7b8c"/>
  </svg>`;
  SPRITES.icon_helmet = makeIcon(helmetSVG);
  SPRITES.icon_legs = makeIcon(legsSVG);
  SPRITES.icon_hands = makeIcon(handsSVG);
  SPRITES.icon_feet = makeIcon(feetSVG);

  const axeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="1" width="2" height="9" fill="#8b5a2b"/>
    <rect x="3" y="1" width="3" height="4" fill="#dcdcdc"/>
    <rect x="6" y="1" width="3" height="4" fill="#a0a0a0"/>
  </svg>`;
  const maceSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="2" width="2" height="6" fill="#8b5a2b"/>
    <rect x="4" y="0" width="4" height="4" fill="#dcdcdc"/>
  </svg>`;
  const daggerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="1" width="2" height="4" fill="#dcdcdc"/>
    <rect x="4" y="5" width="4" height="1" fill="#b8860b"/>
    <rect x="5" y="6" width="2" height="3" fill="#8b4513"/>
  </svg>`;
  const wandSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="2" width="2" height="6" fill="#8b5a2b"/>
    <rect x="5" y="0" width="2" height="2" fill="#b84aff"/>
  </svg>`;
  const staffSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="1" width="2" height="8" fill="#8b5a2b"/>
    <rect x="4" y="0" width="4" height="2" fill="#c0c0c0"/>
  </svg>`;
  const spearSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <path d="M6 0 L9 3 H3 L6 0" fill="#dcdcdc"/>
    <rect x="5" y="3" width="2" height="7" fill="#8b5a2b"/>
  </svg>`;
  const halberdSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <path d="M6 0 L9 3 H3 L6 0" fill="#dcdcdc"/>
    <rect x="5" y="3" width="2" height="7" fill="#8b5a2b"/>
    <rect x="7" y="4" width="3" height="3" fill="#dcdcdc"/>
  </svg>`;
  const crossbowSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="1" width="2" height="9" fill="#8b5a2b"/>
    <rect x="2" y="4" width="8" height="2" fill="#8b5a2b"/>
    <rect x="3" y="4" width="6" height="1" fill="#dcdcdc"/>
  </svg>`;
  const flailSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" shape-rendering="crispEdges">
    <rect x="5" y="1" width="2" height="4" fill="#8b5a2b"/>
    <rect x="6" y="5" width="1" height="2" fill="#dcdcdc"/>
    <rect x="5" y="7" width="4" height="4" fill="#dcdcdc"/>
  </svg>`;
  const katanaSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <path d="M2 10 L9 1" stroke="#dcdcdc" stroke-width="2"/>
    <rect x="1" y="9" width="4" height="1" fill="#8b5a2b"/>
  </svg>`;
  const weaponIcons = {
    sword: swordLootSVG,
    bow: bowLootSVG,
    axe: axeSVG,
    mace: maceSVG,
    dagger: daggerSVG,
    wand: wandSVG,
    staff: staffSVG,
    spear: spearSVG,
    halberd: halberdSVG,
    crossbow: crossbowSVG,
    flail: flailSVG,
    katana: katanaSVG
  };
  for(const [k,svg] of Object.entries(weaponIcons)){
    SPRITES['icon_'+k] = makeIcon(svg);
  }

  // Bat idle animations 24x24
  function makeBatAnim(wing, body){
    const frames = [];
    const wingPos = [
      {x:2,y:12,w:8,h:6},
      {x:4,y:8,w:6,h:6},
      {x:2,y:12,w:8,h:6},
      {x:0,y:14,w:10,h:6}
    ];
    const bob = [0,-1,0,1];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=24;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const w=wingPos[i];
      const oy=bob[i];
      px(g,w.x,w.y+oy,w.w,w.h,wing);
      px(g,24-w.x-w.w,w.y+oy,w.w,w.h,wing);
      px(g,9,10+oy,6,8,body);
      px(g,10,8+oy,4,3,body);
      px(g,10,12+oy,1,2,'#9b0000'); px(g,13,12+oy,1,2,'#9b0000');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.bat = makeBatAnim('#20222b','#2e3240');
  SPRITES.bat_brown = makeBatAnim('#3b2b1a','#4c3524');
  // Skeleton warrior animation loaded from external assets (run + attack frames)
  function loadSkeletonWarriorAnim(){
    const run = [], attack = [];
    for(let i=0;i<6;i++){
      const img = new Image();
      img.src = `assets/Skeleton warrior/Frames/Run/Down/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,24,24);
        // source frames are 32x48, scale to square 24x24
        g.drawImage(img,0,0,32,48,0,0,24,24);
      };
      run.push(c);
    }
    for(let i=0;i<4;i++){
      const img = new Image();
      img.src = `assets/Skeleton warrior/Frames/Attack/Down/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,24,24);
        g.drawImage(img,0,0,32,48,0,0,24,24);
      };
      attack.push(c);
    }
    return { cv: run[0], frames: run, attack };
  }
  const skeletonSprite = loadSkeletonWarriorAnim();
  SPRITES.skeleton = skeletonSprite;
  SPRITES.skeleton_red = skeletonSprite;
  SPRITES.skeleton_green = skeletonSprite;

  // Skeleton archer animation loaded from external assets
  function loadSkeletonArcherAnim(){
    const run = [], attack = [];
    for(let i=0;i<6;i++){
      const img = new Image();
      img.src = `assets/Skeleton archer/Frames/Run/Down/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,24,24);
        g.drawImage(img,0,0,32,48,0,0,24,24);
      };
      run.push(c);
    }
    for(let i=0;i<6;i++){
      const img = new Image();
      img.src = `assets/Skeleton archer/Frames/Attack/Down/${String(i).padStart(2,'0')}.png`;
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      img.onload = () => {
        g.clearRect(0,0,24,24);
        g.drawImage(img,0,0,32,48,0,0,24,24);
      };
      attack.push(c);
    }
    return { cv: run[0], frames: run, attack };
  }
  SPRITES.skeleton_archer = loadSkeletonArcherAnim();

  // Skull wolf animation loaded from sprite sheet
  function loadSkullWolfAnim(){
    const frameW = 64, frameH = 64;
    const idle = [], death = [];
    const img = new Image();
    img.src = 'assets/Skullwolf/Massacre Sprite Sheet.png';
    img.onload = () => {
      for(let i=0;i<7;i++){
        const ig = idle[i].getContext('2d');
        ig.imageSmoothingEnabled = false;
        ig.clearRect(0,0,frameW,frameH);
        ig.drawImage(img,i*frameW,0,frameW,frameH,0,0,frameW,frameH);
        const dg = death[i].getContext('2d');
        dg.imageSmoothingEnabled = false;
        dg.clearRect(0,0,frameW,frameH);
        dg.drawImage(img,i*frameW,frameH*3,frameW,frameH,0,0,frameW,frameH);
      }
    };
    for(let i=0;i<7;i++){
      const ci=document.createElement('canvas'); ci.width=ci.height=frameW; idle.push(ci);
      const cd=document.createElement('canvas'); cd.width=cd.height=frameH; death.push(cd);
    }
    return { cv: idle[0], idle, move: idle, death };
  }
  SPRITES.skull_wolf = loadSkullWolfAnim();

  // Skeleton Mage 24x24 (caster enemy)
  function makeMageAnim(){
    const frames = [];
    const orbYOffset = [0,-1,0,1];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=24;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const bob = (i%2===0)?0:1;
      // skull
      px(g,7,2+bob,10,6,'#e9edf1');
      px(g,9,4+bob,2,2,'#7e4ab8');
      px(g,13,4+bob,2,2,'#7e4ab8');
      // body
      px(g,8,10+bob,8,6,'#dde3ea');
      px(g,6,10+bob,2,4,'#dde3ea');
      px(g,16,10+bob,2,4,'#dde3ea');
      px(g,8,18+bob,3,3,'#dde3ea');
      px(g,13,18+bob,3,3,'#dde3ea');
      // casting arm
      px(g,18,10+bob,4,2,'#dde3ea');
      // purple orb
      const oy = 5 + orbYOffset[i];
      px(g,21,oy+bob,2,2,'#b84aff');
      px(g,22,oy-1+bob,1,1,'#d9a3ff');
      px(g,23,oy-2+bob,1,1,'#d9a3ff');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.mage = makeMageAnim();
  SPRITES.mage_red = makeMageAnim();
  SPRITES.mage_green = makeMageAnim();

  // Goblin animation 24x24
  function makeGoblinAnim(){
    const frames = [];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=24;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const bob = (i%2===0)?0:1;
      const step = i<2?0:1;
      // legs
      px(g,7+step,18+bob,4,4,'#2e8b57');
      px(g,13-step,18+bob,4,4,'#2e8b57');
      // torso
      px(g,6,10+bob,12,8,'#3cb043');
      // head
      px(g,8,4+bob,8,6,'#3cb043');
      // eyes
      px(g,10,6+bob,2,2,'#000');
      px(g,14,6+bob,2,2,'#000');
      // ears
      px(g,4,4+bob,3,3,'#3cb043');
      px(g,17,4+bob,3,3,'#3cb043');
      // arms
      px(g,5-step,12+bob,2,4,'#3cb043');
      px(g,17+step,12+bob,2,4,'#3cb043');
      // dagger
      px(g,19+step,12+bob,2,8,'#c0c0c0');
      px(g,18+step,18+bob,4,2,'#3a2d1a');
      // loincloth
      px(g,8,16+bob,8,4,'#8b4513');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.goblin = makeGoblinAnim();

  // Ghost idle animations 24x24
  // Inspired by OpenGameArt ghost sprites: https://opengameart.org/content/ghost-pixel-art
  function makeGhostAnim(){
    const frames=[];
    const bob=[0,1,0,-1];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=24;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const oy=bob[i];
      const body='#e0e8ff', shade='#cfd8f8';
      g.globalAlpha=0.85;
      px(g,7,4+oy,10,8,body);
      px(g,6,12+oy,12,4,shade);
      px(g,8,16+oy,8,4,shade);
      g.globalAlpha=1;
      px(g,9,7+oy,2,2,'#000');
      px(g,13,7+oy,2,2,'#000');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.ghost = makeGhostAnim();


  // Boss variants 48x48 with idle animations
  // Griffin idle animation 48x48
  // Inspired by OpenGameArt griffin sprites
  function makeGriffinAnim(){
    const frames=[], bob=[0,1,0,-1], wing=[0,-2,0,-2];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=48;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const oy=bob[i], wy=wing[i];
      const body='#c49a6b', head='#f4e6c4', wingCol='#e0cc91', beak='#d4aa00';
      px(g,4,8+wy+oy,16,12,wingCol);
      px(g,28,8+wy+oy,16,12,wingCol);
      px(g,14,22+oy,20,14,body);
      px(g,16,14+oy,16,8,head);
      px(g,14,18+oy,6,4,beak);
      px(g,22,17+oy,2,2,'#000');
      px(g,26,17+oy,2,2,'#000');
      px(g,32,28+oy,8,4,body);
      outline(g,48);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.griffin = makeGriffinAnim();

  // Dragon animations loaded from sprite sheets
  function loadDragonSheet(src){
    const frame = 256;
    const cols = 4;
    const idle = [], damaged = [], death = [];
    for(let i=0;i<cols;i++){
      const ci=document.createElement('canvas'); ci.width=ci.height=frame; idle.push(ci);
      const cd=document.createElement('canvas'); cd.width=cd.height=frame; damaged.push(cd);
      const cdd=document.createElement('canvas'); cdd.width=cdd.height=frame; death.push(cdd);
    }
    const img = new Image();
    img.src = src;
    img.onload = () => {
      for(let i=0;i<cols;i++){
        const sx=i*frame;
        const ig=idle[i].getContext('2d');
        ig.imageSmoothingEnabled=false;
        ig.clearRect(0,0,frame,frame);
        ig.drawImage(img,sx,0,frame,frame,0,0,frame,frame);

        const dg=damaged[i].getContext('2d');
        dg.imageSmoothingEnabled=false;
        dg.clearRect(0,0,frame,frame);
        dg.drawImage(img,sx,frame,frame,frame,0,0,frame,frame);

        const de=death[i].getContext('2d');
        de.imageSmoothingEnabled=false;
        de.clearRect(0,0,frame,frame);
        de.drawImage(img,sx,frame*2,frame,frame,0,0,frame,frame);
      }
    };
    return { cv: idle[0], idle, move: idle, damaged, death, frames: idle };
  }
  SPRITES.dragon_red = loadDragonSheet('assets/red_dragon_sheet.png');
  SPRITES.dragon_blue = loadDragonSheet('assets/ice_blue_dragon.png');

  function makeDragonHatchling() {
    const frames = [];
    const bob = [0, 1, 0, -1];
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = c.height = 24;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      const oy = bob[i];
      const shell = '#e8e8e8', shellShade = '#c6c6c6';
      const dragon = '#5c8a42', horn = '#ffffb5';
      px(g,7,11,10,1,shell);
      px(g,6,12,12,1,shell);
      px(g,5,13,14,1,shell);
      px(g,4,14,16,6,shell);
      px(g,5,20,14,1,shell);
      px(g,6,21,12,1,shell);
      px(g,7,22,10,1,shell);
      px(g,4,14,1,6,shellShade);
      px(g,19,14,1,6,shellShade);
      px(g,9,5+oy,6,6,dragon);
      px(g,8,5+oy,1,2,horn);
      px(g,15,5+oy,1,2,horn);
      px(g,10,7+oy,1,1,'#000');
      px(g,13,7+oy,1,1,'#000');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.dragon_hatchling = makeDragonHatchling();

  // Invader alien 24x24 (retro space shooter homage)
  SPRITES.invader = makeSprite(24,(g,S)=>{
    const pattern=[
      "00011000",
      "00111100",
      "01111110",
      "11011011",
      "11111111",
      "10111101",
      "10100101",
      "01000010"
    ];
    pattern.forEach((row, y)=>{
      for(let x=0; x<row.length; x++){
        if(row[x]==='1') px(g,4+x*2,4+y*2,2,2,'#7fef6f');
      }
    });
    outline(g,S);
  });

  // Chomper 24x24 (maze-chasing arcade homage)
  SPRITES.chomper = makeSprite(24,(g,S)=>{
    const body='#ffd966';
    const r=10, cx=12, cy=12;
    for(let y=0; y<24; y++){
      for(let x=0; x<24; x++){
        const dx=x-cx, dy=y-cy;
        if(dx*dx+dy*dy<=r*r){
          if(dx>0 && Math.abs(dy) <= dx) continue; // mouth wedge
          px(g,x,y,1,1,body);
        }
      }
    }
    px(g,14,10,2,2,'#000');
    outline(g,S);
  });


  // Portal animation 48x48 (replaces stairs)
  function makePortalSprite(){
    const SIZE = 48;
    const SPEED_SWIRL = 1.2, SPEED_PULSE = 2.0, ARMS = 4, RNG_SPARKLES = 9;
    const PALETTE = ["#23022f","#38075a","#581091","#7d1fd1","#b264ff","#edd8ff"];
    const cv = document.createElement('canvas'); cv.width=cv.height=SIZE;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled=false;

    function px(x,y,color,a=1){
      if(x<0||y<0||x>=SIZE||y>=SIZE) return;
      ctx.globalAlpha=a; ctx.fillStyle=color; ctx.fillRect(x|0,y|0,1,1); ctx.globalAlpha=1;
    }
    function ring(cx,cy,r,color,a=0.3){
      ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(cx+0.5,cy+0.5,r,0,Math.PI*2); ctx.stroke(); ctx.restore();
    }
    function draw(t){
      ctx.clearRect(0,0,SIZE,SIZE);
      const cx=SIZE/2, cy=SIZE/2; const time=t/1000;
      const pulse=0.5+0.5*Math.sin(time*SPEED_PULSE*Math.PI*2);
      const baseAngle=time*SPEED_SWIRL;

      ctx.save(); ctx.globalCompositeOperation='lighter';
      const glowColor=PALETTE[4];
      ring(cx,cy,18,glowColor,0.15+0.25*pulse);
      ring(cx,cy,20,glowColor,0.10+0.20*pulse);
      ring(cx,cy,22,glowColor,0.07+0.15*pulse);
      ctx.restore();

      for(let a=0;a<ARMS;a++){
        for(let r=3;r<=18;r+=0.75){
          const ang=baseAngle + a*(Math.PI*2/ARMS) + r*0.28;
          const x=Math.cos(ang)*r, y=Math.sin(ang)*r;
          const xx=(cx+x)|0, yy=(cy+y)|0;
          const idx=Math.min(PALETTE.length-1, Math.max(0,(PALETTE.length-1)-Math.floor((r-3)/3)));
          const col=PALETTE[idx];
          px(xx,yy,col,0.95);
          if((r*3|0)%2===0){ px(xx+1,yy,col,0.7); px(xx,yy+1,col,0.7); }
        }
      }

      ctx.save(); ctx.globalCompositeOperation='lighter';
      const coreR=4+Math.floor(pulse*2);
      ctx.fillStyle=PALETTE[PALETTE.length-1];
      ctx.beginPath(); ctx.arc(cx+0.5,cy+0.5,coreR,0,Math.PI*2); ctx.fill();
      ring(cx,cy,coreR+2,PALETTE[PALETTE.length-2],0.25+0.25*pulse);
      ctx.restore();

      for(let i=0;i<RNG_SPARKLES;i++){
        const ang=baseAngle*1.5 + i*(Math.PI*2/RNG_SPARKLES);
        const rr=10 + 2*Math.sin(time*3 + i*1.7);
        const x=(cx + Math.cos(ang)*rr)|0;
        const y=(cy + Math.sin(ang)*rr)|0;
        const alpha=0.6 + 0.4*Math.sin(time*6 + i);
        px(x,y,"#ffd8ff",alpha);
      }
    }
    return { cv, draw };
  }
  SPRITES.stairs = makePortalSprite();

  // Merchant goblin 24x24 (with lootbag)
  SPRITES.shop_goblin = makeSprite(24,(g,S)=>{
    // bag
    px(g,3,14,8,6,'#6b4b2a'); px(g,4,13,6,2,'#7a5a37');
    // goblin body
    px(g,12,6,8,8,'#6fcf5a'); px(g,10,10,12,8,'#6fcf5a');
    // eyes
    px(g,14,9,2,2,'#000'); px(g,18,9,2,2,'#000');
    // ear
    px(g,10,7,2,2,'#6fcf5a'); px(g,20,7,2,2,'#6fcf5a');
    // belt
    px(g,10,15,12,2,'#3a2a1a');
    outline(g,S);
  });

  // Merchant stall 24x24 (alternative)
  SPRITES.shop_stall = makeSprite(24,(g,S)=>{
    // counter
    px(g,2,12,20,8,'#6b3f2b'); px(g,3,11,18,2,'#7e4a33');
    // legs
    px(g,3,20,3,2,'#3a2318'); px(g,18,20,3,2,'#3a2318');
    // canopy
    px(g,2,3,20,6,'#b84aff'); px(g,2,3,4,6,'#ffd24a'); px(g,10,3,4,6,'#ffd24a'); px(g,18,3,4,6,'#ffd24a');
    outline(g,S);
  });

  // Merchant tile (purple marker) for visibility hint
  SPRITES.merchant_tile = makeSprite(24,(g,S)=>{ px(g,4,4,16,16,'#8a5cff'); outline(g,S); });

  // Projectile sprites (8x8)
  function makeBallAnim(c1, c2){
    const frames=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas');
      c.width=c.height=8;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      g.fillStyle = i===0?c1:c2;
      g.beginPath();
      g.arc(4,4,3,0,Math.PI*2);
      g.fill();
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  function makeArrowAnim(g1, g2){
    const frames=[];
    for(let i=0;i<2;i++){
      const c=document.createElement('canvas');
      c.width=c.height=8;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const glow = g1 ? (i===0?g1:(g2||g1)) : null;
      if(glow){
        g.fillStyle=glow;
        g.globalAlpha=0.4 + 0.3*i;
        g.fillRect(0,0,8,8);
        g.globalAlpha=1;
      }
      // arrow pointing right
      px(g,0,3,5,2,'#8b5e3c');
      px(g,5,2,3,4,'#c0c0c0');
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.proj_fire   = makeBallAnim('#ff9b4a','#ff6b4a');
  SPRITES.proj_poison = makeBallAnim('#9fe2a1','#76d38b');
  SPRITES.proj_magic  = makeBallAnim('#b84aff','#d6a2ff');
  SPRITES.proj_blast  = makeBallAnim('#ffd24a','#ffe68a');
  SPRITES.proj_ice    = makeBallAnim('#7dd3fc','#bdeafe');
  SPRITES.proj_shock  = makeBallAnim('#facc15','#fde047');
  SPRITES.arrow       = makeArrowAnim();
  SPRITES.arrow_fire  = makeArrowAnim('#ff6b4a','#ff9b4a');
  SPRITES.arrow_shock = makeArrowAnim('#facc15','#fde047');
  SPRITES.arrow_ice   = makeArrowAnim('#7dd3fc','#bdeafe');
  SPRITES.arrow_poison= makeArrowAnim('#76d38b','#9fe2a1');

  // previews on start screen
  const prevWarrior=document.getElementById('prevWarrior');
  const prevMage=document.getElementById('prevMage');
  const prevRogue=document.getElementById('prevRogue');
  const prevSummoner=document.getElementById('prevSummoner');
  if(prevWarrior){ const c=SPRITES.player_warrior.idle[0]; prevWarrior.width=c.width; prevWarrior.height=c.height; prevWarrior.getContext('2d').drawImage(c,0,0);}
  if(prevMage){ const c=SPRITES.player_mage.idle[0]; prevMage.width=c.width; prevMage.height=c.height; prevMage.getContext('2d').drawImage(c,0,0);}
  if(prevRogue){ const c=SPRITES.player_rogue.idle[0]; prevRogue.width=c.width; prevRogue.height=c.height; prevRogue.getContext('2d').drawImage(c,0,0);}
  if(prevSummoner){ const c=SPRITES.player_summoner.idle[0]; prevSummoner.width=c.width; prevSummoner.height=c.height; prevSummoner.getContext('2d').drawImage(c,0,0);}
}

// generate immediately so previews show on start
genSprites();

// expose a single global for game code and modders
const ASSETS = { textures: TEXTURES, sprites: SPRITES };
globalThis.ASSETS = ASSETS;

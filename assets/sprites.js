// procedural floor and wall textures (no external assets)
const floorTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#8B4513';
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = '#A0522D';
  g.fillRect(0, 0, 16, 16);
  g.fillRect(16, 16, 16, 16);
  return c;
})();
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
  floor: floorTex,
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
  function makePlayerMageAnim(){
    function drawFrame(g, oy, step){
      // staff
      px(g,20+step,6+oy,2,12,'#8b5e3c');
      px(g,19+step,4+oy,4,4,'#b84aff');
      // boots
      px(g,7,18+oy,10,3,'#3a2d1a');
      // robe
      px(g,6,8+oy,12,10,'#4a3a8a');
      px(g,5,10+oy,2,8,'#4a3a8a');
      px(g,17,10+oy,2,8,'#4a3a8a');
      // arms
      px(g,4-step,10+oy,2,6,'#4a3a8a');
      px(g,18+step,10+oy,2,6,'#4a3a8a');
      // head & hood
      px(g,8,2+oy,8,6,'#e3c6a6');
      px(g,9,4+oy,2,2,'#000'); px(g,13,4+oy,2,2,'#000');
      px(g,7,1+oy,10,2,'#4a3a8a');
      px(g,6,2+oy,12,2,'#4a3a8a');
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
  SPRITES.player_mage = makePlayerMageAnim();

  // Slime idle animations 24x24
  function makeSlimeAnim(c1, c2, c3){
    const frames = [];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=24;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const bob = (i%2===0)?0:1;
      px(g,4,10+bob,16,10-bob,c1);
      px(g,6,8+bob,12,10-bob,c2);
      px(g,8,6+bob,8,8,c3);
      px(g,9,11+bob,2,2,'#131340');
      px(g,13,11+bob,2,2,'#131340');
      outline(g,24);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.slime = makeSlimeAnim('#5ca94a','#6bbd59','#8ed97b');
  SPRITES.slime_red = makeSlimeAnim('#d35e5e','#e06e6e','#f18b8b');
  SPRITES.slime_yellow = makeSlimeAnim('#d3c85e','#e0d56e','#f1e58b');
  SPRITES.slime_blue = makeSlimeAnim('#5e6ed3','#6e7ce0','#8b9bf1');
  SPRITES.slime_purple = makeSlimeAnim('#a45ed3','#b06ee0','#c68bf1');
  SPRITES.slime_shadow = makeSlimeAnim('#1a1f2f','#2f1a1a','#3a2a2a');

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
  // Skeleton 24x24 (allows simple recolors)
  function makeSkeleton(skull='#e9edf1', bone='#dde3ea'){
    return makeSprite(24,(g,S)=>{
      px(g,7,2,10,6,skull); px(g,9,4,2,2,'#000'); px(g,13,4,2,2,'#000');
      px(g,8,10,8,6,bone); px(g,6,10,2,4,bone); px(g,16,10,2,4,bone);
      px(g,8,18,3,3,bone); px(g,13,18,3,3,bone);
      outline(g,S);
    });
  }
  SPRITES.skeleton = makeSkeleton();
  SPRITES.skeleton_red = makeSkeleton('#ff8b8b','#ff6b6b');
  SPRITES.skeleton_green = makeSkeleton('#9fe2a1','#76d38b');

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

  // Goblin idle animations 24x24 (from sprite sheet)
    const GOBLIN_FRAMES = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFcklEQVR4nEXVzYplVxnG8f/zrrX3Pl9V1V1d3WkTjcEgJMRInIiSIEJAyMSh08wcKAgOhIy8BMGBV+DIOxAMZCIYB05UTEJ3YhKTTlfXR+rj1Klzzl5rPQ5K8BLeh5ffXz996w2yAvpGm4xsJ0vWLCnaMto0FVIEyCg1jHAFKgjTqqkhUghlE71AIAsIcnKHEigFtdtQ+g2jNpSxUDDGtDBdFnbQoqIAErQCpYGbMY0AQIQSZIhqcj9MSD3QQRrMw+EfBKKrU2iVZtOlBJ2QREo3F7g1LChtpBWRAloEYy5IAYJ5npKHYU7fJfKQve0HXuy/pcPxcx4sH9OotAbP9vtsY0NgXDPIOJuWzIOPTnzrYCpV0EaMx4VS4KXn7xMlkefDzMNkYBh2cNdoIz65vpR4RKSEa+GjD5/4a9++JbWgRUOAmghMdoCEDHYjDwkFbC7NJHXkST9n2i+YDnvIC5zEuc55Lm/4+5P3DWL1m8rvv975Rx9/xr1fz/S7P9zyr9680HoE01geru3UCAX3b93WtOtI15kcPZEjkdUxST05JaJO2Cm3WXiPb+x/Vc/s3VZ/t+PszoSuh2GWSYspuYfpVJiABKHE3flCGgVrwXWQNpnsUiBvqc24mf+8f0J3P9OPC+ZlweiR7k34Wf6M7/zivmjwy58cySNAI2FMwqrENtNJJDIRmWiJXMY12yTSKnNxeUKhkTcitmJoHRMNPDe7q0/HYz/84EujYHe309nhxjkJknj2eqEyQE6J7EQmSBUii7xenqutr9z6Ky4ugrYpuj7uWfuSbRrJYVKIV3hKOjAfbL/k4otr5xACXnhnTs729Q86GZGdUAMMppJX16dsUtLqeuTqrw/96PLEYwN9d1fbCTQVchX33pt499+FBz/P8pHwaePlf+0hwec/Lmps2NGcbt0RW0EBbxr5anWFOkNufPHaqI/nlbPDlUNXvpd2hOCoXnryZAc/f8D3/njA335ovfRgn8lT2cj6VI8BcbxdMh0mYGjVFEZiuV2yWi25Wq9gmxCVF97uEI1jn/uoXhgbbBqWEZ2CuXpL4snRqc9ONsai64X7Qusr7gqFLbG8WHK5umZ9cUX/RMx+O/rweM3loy0QOODsaMO9l28r/kfYK+/cdcVMvvm6rMTyfOTyy83Nxz4j2lApUdkykperDV0WLZvcVfZeP9AiV3Z3KzVX3MQLs320BDB2YMEXh6d0O4/Rc6/p1fEvnC8KnxyfG5/rfr4NUamYvFqtUYacRUwgTRpNDVURo6AGpTaePDj1EAYnh03bbrh6723XKtJLWZvSKGNFmEqhEYRF3m5Hy2CFUhXVpgnUGacgTcRH61PvPe64M09YBWioiWe//7oeHZ7xz/m7fjomkn3TCwnTKIjY1kYpZl3waDMCLRkUxDRgAWk/a38nYUHDyKKlyifv/snRZ9Ltgi1aBRqc1CUtoGKiVKjVoEIzNxQncDZ05tRXpGkGN6AStBt7HEhm9cGf7WqaGt00EzK1NVwb1EakHNAlFFkkUMqklEkpkCBZXJ9t/PCNQn11LhO4weOzxuGFOX0zCYmjzcp3dmbqtz3TcWAcTW0mcpfp+qR0Ex2iA2VBDiCz18/Y3R8UIUpv4sVep1eNlMVXXp1ISSCRqv/f4Y3weMNF7qdZKQvNTJqbmBsNoP5mitILFzDwYT73i3du6e5rM4mgHYi9kjlPG5xNdEFshEIoQfQmD4sO9SZNIWZGM+NJQX1w3F3hdbtJuRuiEbsZpkEkYAeu+kv27gxqNkcnl3761p5iFNEHtsnTvYE0AFMT80KbVmoKnBsHeUbrQTYadhSjyDURxTREnpg7eQf3DdvsTxeKAjknWjGRgv8CygXz/LxG7s4AAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFXklEQVR4nC2VzYtdWRXFf2ufc+/7rEpVKpWqJB0NGKHpgDTaaOPED1TQiThoB04dORFxLDhx4N/Qjh2Ic50oHVSkRUEQbBViEhLzUUmqUp/vvXvvOXs7eL3He+8Fa629tt57/zZmAQEuiBLU3qm9EzXwJEiQLRAQGF6D6k6tDgIzYY1hScgAROBEFdlSAqsoQDiRAyq4KlVCBDKDRutBh1BQS1A9QIFLJIFMKAuTcNcaXIBS4jQtObcVF3mF56AkMcipcvJYpBGkUZCnwBiqVQacLtY91Zx2luiagWXu+cffXiCJnMPwYmyP5wzV+efDp7TjRABRnKvTOd2oxyNAECGsdY6Ol7x+vsJTsLU1gpV4fup4iE9fu8Lb7+5SFkG2YUprCS9B35ySMoQHABI8/t8JNzcvIdZlFggRgmSGhWNZVIlcwBMsjjtUWWvQrCaM8ixGacJ23GS+cV1/fPxn5EEEzPYafvqzUXzn/iO2fzLRr365H9988JBrP5/JcYzE2asBKcDE3nROt3TwwKrINjSMmTFvrrA3+hTnzXF0e0v95u6Hsftmo6iw3GiY7LSMponjbaM9bVjvE0HFBJfaOYYzLJw6ACE0VHLum2htxJQNJnmTtuxwzZ6E+JBKonTiB19/pDt3tiHgx9890A4N1YEIiDVd1gcqhgbwWsFFVMjmhjxh1WiUCER9dplvf+4bHPSP6OuCx+mAf310RE7GfKuFMM5fLpHEG/0cTAwWUA0vASXwIdYAPgwEPcXOOMvPGbXX1/wNlVGfwRJ3mn3SBO7ZIacvBizWfL91dxaNQfeFRsum0CtQETVA7rgHufQ9fZyxqAHnC0Z7OwQzFuev1atHqbD70SQaM+5/aSL315QQdz5Q3Lh5FVz85Y2nbPqEvABX4AEWCQXkYVhpNRA1dXS140+z32p1uef0Sc+N8SWe1CN0MufWpV3e/WAn/vrVXmbGrft7EMGLw0MAzmzB5dmMGqItQfG6BurrkotyrkV/opN0oUKH5NjYeabXpBb+/c6Z3AQGjSc+//urobW+KAIsIIzj0ZI8FXlq5LGRR2B9GeiGBRfdgtViyenDnm7POD/rQnLcxTv1KkkCF5/9w344xs7XfsTRyyMIcXKwAhx3h7Gj1rFWWJvIgxe8CJVKTcHb7KPfFbp2prN+ICIox86zpy/Z37+MhwHw4P49uP0VdO8uN7TJk1cXbO2NiFZEa1CCqE7uvCeVQAVqEbIAc2oSuUsMUZk+HKJYcHTwElMG4PDBLwgLjk4H5sMU5cA9iBofX3VFLVhEoa+VnqDgdDhlBHUmysyITXFw2HF03nN0Xjg8W/HybMln3vs+lGBjZvQjkIEpIAEGYUGlYgNra1Wv9ApqI3yciYlhW+Joa4EILFiLCZjB33/9PpjIOVFaxwM84Lhbrq3qIoph4cFQfR3P5tCAjwNN4HB0ytlxT3gwsM6XIAiEAb0XXn0PpQaM4Pywx4FSHMKRglwILEENsDah1lCboKn4x5F9/1uDbj/foD1N0T9Y4TjPjyv5h60IeHp+wdXplCYlDIMCQ4Wo67SFxsgjkcZGGgmNIJKxkze4dGWEE3S7otuuOl44hxeVT3xxLCIInIxAokQQy6D2AUMQQyI3DaScSCNhY8PaQOMgmoAsttopr1PPk/aUT25fYuvLE0UV3dzZHloeLU6AQK2wAaIIKiiE4eRmkrBkKCfyOKAV3jj/+e8LNm+NUQ3MhRKwIWht/cxbcTru2GwbPODV4QJLzvXxFuGBD+AGOc0zTRZqBa0gBRK8+dYuHlA92LnhyEXqganhHwu9nTLeOCHn8r4R1VEx8KBUR4j/A7V8EvBwEi3IAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFW0lEQVR4nC2VO6ulZxmGr/t532+d9nHOhwxkEhMMI9EkKlgECxFMZ6ONhY2VEBDEWlu7/BULqzQiJI2MoEE0jENgZPYc9tqz18w+rLW+9b3P81js/IOb+3Dd+tnvvkOZiNjuyZ2BMMcJwp1GkpFYEdWMEoIQFkG6cAuCpMmxIrIULA2FMA9yMOp0d4Jtge84x6MTUJBAWRUiklRSTZQRmAwiSQk1END6JJpwJaMC/WQDCTsxQb2o27Mdcpw5lNRivmTv+pTZDAaMbGBFIOO8DcgGMFCIGINIZBUfnDqu5FiMECbBMsAqdau7nBTHmeS9K1X3H/8TM0GBTAMSpbh+c4YUEEYqKZ40M756cJi7VzvpzCBFZgDi9b19iid1u9vDOoFglLv53hXp+fKAB8+epBIUSblRWU5T43Uh5ASVKkcEyuT0qGUKCsGtG/ua2ohYGzUrNi177JabXB+9SZ3f5E79Zl6qN7l7/ZqQkIn1J6k//HErv/jVEc8PVvz+k0kuzpfM5yuQkQkyuHZpX1oZ9EJ9xTYddVwmjDVhUnZ4+7XbzNtD9jnKtZ+r5JwgGf0y89f1gPd+cwUi+e0vDqVzQwQZYF/nUs6gdMK8IIlqlWpeUGeQBuk8/MchW2/ssqt93rr0utZ+jodzsFrk9rRSanJ0KF48WVKrZUi8+WpHMRXKSglDxTDrgEod+hWmwpArnh0cMO3GWN9T25Rxm9Jyg4Xx7viW7BAenC04nW+yVAHi3b+MsRLZfjDRUAwzUVPIEwzqpj+B1qPaI5LWnNogzhooETCL5NaX4xw9H/HwpwtJQabxrc+2UIVHP3cRZ9xo29hQwYE05FDPT4/ZZKW3OU//fp+n82MsE/vhLZZ2wqr0/Lct0p6cc/vWDX50/25+/uMnev9P19JuJ9HgUTtAEs9GJ9zWZXIDtCSHRj09e6lSRJGzeN94tDPw6qhP8kEaggCTKN0IS7EeBuw8sFGAG/PjI14t+ty/PFFJg0mghAynybDT1QknywWL4RUntgZB6mIsSRKe4MH1dy4plBDJd/96LUHs3PsJibAwTl70CdCsEaMBLwOeA/XlyQm1JGVi7EbH+NOaQ5vw6sMi70SR2FoV0h2ykJlg4unBnPneAfbGh3zw4m+a31nx6Nmr1I3UjW6PUJIxUM/OltlVyTaJLQP7xlieBbWGDADCYfHly+xI0gwSVn3DvvgUR3TvTPAAAoEIiQzHQ9Szs5VKJ2pnaBTYCGIMToEaUI1NCf7zeKXbuyQqFzRVcuf7H/H48SHr2b+IkrQWpCC9ESE8oK5WjdJEcdElyBJNwQowMTQ25nHGrX1lCjICSSjh0Wd/ZtnQs29HXi1TqUImHGvJTs5oLamrtWOedFFpRXQkJmFVWIXTusSXpFniKQyhvOB/qYV173gLnGA8GmVmamiiuTM0UYc2YAFJkiODENULtKB83SVF8uCjgTiW3v58kipBRRycuOzjDg4b3bRwpZvqq/vnmJzZ3RHRgtqaow5SiWWluHBdAMypzGyGz5bqe8vXYkrelY7/3fCAa98bs6AhJUcvznJ/tq237m2TvRhOHd84tUWgJuTQgBKJpZBEMS7OxwAX/9s+5+61bXY/GBNdMlwxZj7hJT0eF2fTehHLxPukrYPqHpRieLtQNZioCFRYsKIOduE7iVvi2yKK0Ai4DC9Zsnd1JBCHz5d5fbylCMc3iceFlUQ6ZoUgsRCRIgSX6wxGECEmexPROywhBXSFYsGVskUC4clov5OfN6IlkU5bJzUyMBVaQPVgcMOaExsy+5CFqFzULwKQUBUux4Yk14BBNPB14hvSG/INZCb/B9SxKElA8uojAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFd0lEQVR4nC2Vy45mZRWGn7W+vf9jVXdVN13dDQHSgBGQBNMQDzHGECcMTIwmDpk4caSJI+PAK5A7cOAFaOLAoSZGE6MyEwgDaDl0I3QVdeiqv/7D3vtb63Xwewfvs/Ku57UfvnkHbxybJCqQEikRtaKASDAHx3Ack4gUEUJFJIFwzKGYgQEbpy6DXImGqVOmsGg6ZOCCZlWoIdIEiFFbaEcGOJmJVWPY9CghZbhXpMJ4XqhNUHDoIUfCizmmwuVhx+FHl5SRYTsNZcfxSUOdON04uSwDS1+zbHv6Sc9JXRIphhpoWrCR045HnP53BVWgJBMaS4O+8MT+PsNN8eEnR+AGKeSwOOp45sU9HCcBl4EJRfLp+QVk4ucGMh6M4M6VPYZVok6oF43XhlYtbnPaPrkza3n7049IJQYYjkaFFFBFjEADmBUYBtwMQuzvzmgxhkuhLlAP6oW3w4Rp3edq3NCN8qxu+3N66daXOHlnACtonPzy1zN98PNHOvx8w6/enOqDXzxSIixFCK7NZ1gHrIxhFeQyGZbJ0CVNUydMfK4rdsD+6HHqOIg0MXnXXEI9/OT1B/blF66RKX72o2O77oVMke6YCV8k5i2Whg0wDIIhycFo2mwYMWGuXa6UWzgzln7B977xbc6Gz9io48HqkN1Zi0wcHq3JdC6PN4Dx5GoXXKgRkpFhqCZZQTVpst92Mzyo/SWTdsbi/oSdq/vaxNLgnOd3bsF/Cvc4ZvmwI4thZrzwl6lGjdG/2timhUgDCasFy0QmXJGoH8j1ks3lMTUCSWhIfEh8EE/9a6qDf47k1hAyJOPu73b15BO3OTi4xmdPr/Crhs/BG6dtjDIGd6dR39HFksVa5PkJ7//pj5w/WlC+dmCLckHfrvnzU6f22qd39K2/39Rbrx9ZaRoOXr5OAsdHZ2QYx82K680MCRwoXiiIpq89ZVgadOpL8NZ3Ds0NTo/e43a5ysO6oI6BdIKENdz96zWlAIdohFsijNN2zf5kjtLAE7njfWxYDytWsbRlrowCgbA0Ph8WGMldu4FIMOPVv90SEo+99lPOTs4pcs6PKjLDSHwiysQobcFbw7vas+7XrNcbunXP85/d4Nk/jPXVxQ3uxBWe7q/QXBrHX5ySkSiNSuHD+/eIp79J0zjPjvZYHHdENcy3ZNYk1iZNNwTRJ5HBOAzrkuaZqa37Hi9G4JR3OpVMFidnW3QK5/d/SwIPzwb2XplgrXBBOriLNEiE1zrQ155NdlwOHauarEtlaI0sUCfGux9fcrbuOD7fcHLRcXq+4ivf/zHKAJPVEiBDtlV9JQmBUjR9VCy3nm8B2sBb0A7EzDgbnfPE9ZaUKC5MUIF///43yJODPdPFDLM1mIxlrtixGWm5JYgQtSZDDToTgyfDWMQELvY2bC63w2L/T5UYDlhJ3I2Hb7QWbqQZJ4cdfUBEkn1QO/CuBpvoGSLosjKQpIksSSgJiXvf7Wx4aWz3H65IEi/Oex93HL1hRg3KzLg2m7D6pPLgHwv6TdB3lTr02Ms/2IU0vBhN45R5oZ0X/KrIuVh7x9kXHY9fzmg+h8XbHZLpytfHdv7qgAQXRz2Pzae4GVkNbURdJdEFzRACgQV4ASlpvEADTYFdn/BFdjy8uuSmzZhNR9CYDXuw00846pfIBQWiF9mJWItYBVGNJoeEBDejJjRWoAT33j/l5iszCFFMyIWmTpXwxrC5ceYrZnNnOhtxerKmr8F1zYgqIoLooKkZWBoqjkVQBiPlPPfiY5iBFZje2CbLoWITJ21Lu+c7lFZkwHgviE0yPAqoIivbTVaAEkAgI1NEFU0vSrs1ZxMiq5HmpNn2U9PwTWy9k6LptydSst3zMDKC/wG+tpMPucEtygAAAABJRU5ErkJggg==",
  ];
  SPRITES.goblin = spriteFromB64Frames(24, GOBLIN_FRAMES);

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

  // Dragon idle animation 48x48
  // Inspired by OpenGameArt dragon sprites
  function makeDragonAnim(){
    const frames=[], bob=[0,1,0,-1], wing=[0,-2,0,-2];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=48;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const oy=bob[i], wy=wing[i];
      const body='#5c8a42', wingCol='#7ba75e', belly='#a2d46f', horn='#ffffb5', flame='#6cf';
      px(g,2,8+wy+oy,18,12,wingCol);
      px(g,28,8+wy+oy,18,12,wingCol);
      px(g,14,22+oy,20,12,body);
      px(g,14,26+oy,20,6,belly);
      px(g,18,14+oy,12,8,body);
      px(g,18,12+oy,2,4,horn);
      px(g,28,12+oy,2,4,horn);
      px(g,22,18+oy,2,2,'#000');
      px(g,8,18+oy+i%2,4,2,flame);
      px(g,32,26+oy,10,4,body);
      outline(g,48);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.dragon = makeDragonAnim();

  // Snake idle animation 48x48
  // Inspired by OpenGameArt snake sprite sheets
  function makeSnakeAnim(){
    const frames=[], bob=[0,1,0,-1], sway=[0,2,0,-2];
    for(let i=0;i<4;i++){
      const c=document.createElement('canvas');
      c.width=c.height=48;
      const g=c.getContext('2d');
      g.imageSmoothingEnabled=false;
      const oy=bob[i], sx=sway[i];
      const body='#8a5c8a', belly='#b97ab9', tongue='#f44';
      px(g,12+sx,28+oy,24,8,body);
      px(g,8+sx,20+oy,16,8,body);
      px(g,24+sx,20+oy,16,8,body);
      px(g,18+sx,14+oy,12,6,body);
      px(g,18+sx,18+oy,12,4,belly);
      px(g,20+sx,16+oy,2,2,'#000');
      px(g,26+sx,16+oy,2,2,'#000');
      if(i%2===0) px(g,24+sx,20+oy,2,4,tongue);
      outline(g,48);
      frames.push(c);
    }
    return { cv: frames[0], frames };
  }
  SPRITES.snake = makeSnakeAnim();

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
  if(prevWarrior){ const c=SPRITES.player_warrior.idle[0]; prevWarrior.width=c.width; prevWarrior.height=c.height; prevWarrior.getContext('2d').drawImage(c,0,0);}
  if(prevMage){ const c=SPRITES.player_mage.idle[0]; prevMage.width=c.width; prevMage.height=c.height; prevMage.getContext('2d').drawImage(c,0,0);}
}

// generate immediately so previews show on start
genSprites();

// expose a single global for game code and modders
const ASSETS = { textures: TEXTURES, sprites: SPRITES };
globalThis.ASSETS = ASSETS;

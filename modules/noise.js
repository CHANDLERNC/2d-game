export function createNoise2D(rng){
  const perm = new Uint8Array(512);
  for(let i=0;i<256;i++) perm[i]=i;
  for(let i=255;i>0;i--){
    const j = (rng.next()*256)|0;
    [perm[i], perm[j]]=[perm[j], perm[i]];
  }
  for(let i=0;i<256;i++) perm[i+256]=perm[i];
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function grad(hash,x,y){
    switch(hash&3){
      case 0: return x+y;
      case 1: return -x+y;
      case 2: return x-y;
      default: return -x-y;
    }
  }
  return function(x,y){
    const X=Math.floor(x)&255;
    const Y=Math.floor(y)&255;
    x-=Math.floor(x);
    y-=Math.floor(y);
    const u=fade(x);
    const v=fade(y);
    const aa=perm[X+perm[Y]];
    const ab=perm[X+perm[Y+1]];
    const ba=perm[X+1+perm[Y]];
    const bb=perm[X+1+perm[Y+1]];
    const res=lerp(
      lerp(grad(aa,x,y), grad(ba,x-1,y), u),
      lerp(grad(ab,x,y-1), grad(bb,x-1,y-1), u),
      v
    );
    return res;
  };
}

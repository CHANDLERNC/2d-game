// Main game loop utilities

let last = performance.now();

function startLoop(update, draw){
  function frame(now){
    const dt = Math.min(50, now - last);
    last = now;
    update(dt);
    draw(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export { startLoop };

const keys = {};

function initInput(onAction) {
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (onAction) onAction(key, e);
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });
}

function initMobileControls() {
  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const on = e => { e.preventDefault(); keys[key] = true; };
    const off = e => { e.preventDefault(); keys[key] = false; };
    el.addEventListener('touchstart', on);
    el.addEventListener('mousedown', on);
    ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev => el.addEventListener(ev, off));
  };
  bind('btnUp', 'w');
  bind('btnDown', 's');
  bind('btnLeft', 'a');
  bind('btnRight', 'd');
  bind('btnAction', 'e');
}

export { keys, initInput, initMobileControls };

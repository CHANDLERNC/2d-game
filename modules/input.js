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

export { keys, initInput };

// Skill tree demonstration inspired by the JavaFX version from SkillTreeDemo.java.
// This module renders three panes (Attack, Defence and Utility) and allows the
// player to unlock and refund abilities.  It is self contained and does not
// integrate with the main game logic yet; it is intended as a reference
// implementation for a richer skill tree UI.

// Data model ---------------------------------------------------------------

class Skill {
  constructor(id, name, tree, cost, requires = []) {
    this.id = id;
    this.name = name;
    this.tree = tree;
    this.cost = cost;
    this.requires = requires;
  }
}

class PlayerState {
  constructor(points = 4) {
    this.points = points;
    this.unlocked = new Set();
  }

  canUnlock(skill) {
    if (this.unlocked.has(skill.id)) return false;
    if (this.points < skill.cost) return false;
    return skill.requires.every(r => this.unlocked.has(r));
  }

  unlock(skill) {
    if (!this.canUnlock(skill)) return false;
    this.points -= skill.cost;
    this.unlocked.add(skill.id);
    return true;
  }

  refund(skill, skills) {
    const required = Object.values(skills).some(s =>
      s.requires.includes(skill.id) && this.unlocked.has(s.id)
    );
    if (required) return false;
    if (this.unlocked.delete(skill.id)) {
      this.points += skill.cost;
      return true;
    }
    return false;
  }
}

// Rendering ---------------------------------------------------------------

/**
 * Create a skill tree demo inside the provided root element.  The structure and
 * layout mirror the JavaFX version but rely only on standard DOM APIs so it can
 * be dropped into the existing game without additional dependencies.
 *
 * The demo is intentionally verbose to serve as a guide for future integration
 * with real game data.
 *
 * @param {HTMLElement} root container to build the UI in
 */
export function createSkillTreeDemo(root) {
  // Build skill definitions
  const skills = {};
  const add = s => { skills[s.id] = s; };
  add(new Skill('A1', 'Ignite', 'attack', 1));
  add(new Skill('A2', 'Pierce', 'attack', 1, ['A1']));
  add(new Skill('A3', 'Combust', 'attack', 1, ['A2']));
  add(new Skill('A4', 'Berserk', 'attack', 1, ['A2']));
  add(new Skill('D1', 'Guard', 'defence', 1));
  add(new Skill('D2', 'Fortify', 'defence', 1, ['D1']));
  add(new Skill('D3', 'Aegis', 'defence', 1, ['D2']));
  add(new Skill('D4', 'Thorns', 'defence', 1, ['D2']));
  add(new Skill('U1', 'Spark', 'utility', 1));
  add(new Skill('U2', 'Quickstep', 'utility', 1, ['U1']));
  add(new Skill('U3', 'Recall', 'utility', 1, ['U2']));
  add(new Skill('U4', 'Tinker', 'utility', 1, ['U2']));

  const player = new PlayerState();

  // create layout containers
  root.classList.add('skill-tree-demo');
  const pointsLabel = document.createElement('div');
  pointsLabel.className = 'std-points';
  root.appendChild(pointsLabel);

  const panes = {
    attack: makeTreePane('Attack', '#ff4d4f'),
    defence: makeTreePane('Defence', '#2ecc71'),
    utility: makeTreePane('Utility', '#49a6ff')
  };

  const center = document.createElement('div');
  center.className = 'std-center';
  Object.values(panes).forEach(p => center.appendChild(p.wrapper));
  root.appendChild(center);

  // create skill nodes
  const nodes = {};
  function createNode(skill, color, emoji) {
    const n = document.createElement('div');
    n.className = 'std-node';
    n.innerHTML = `<div class="std-circle"></div><div class="std-icon">${emoji}</div><div class="std-caption">${skill.name}</div>`;
    n.style.setProperty('--color', color);
    n.dataset.id = skill.id;
    panes[skill.tree].inner.appendChild(n);
    nodes[skill.id] = n;
    return n;
  }

  // placement mimics Java coordinates
  function place(node, x, y) {
    node.style.left = x + 'px';
    node.style.top = y + 'px';
  }

  place(createNode(skills.A1, '#ff4d4f', '🔥'), 40, 40);
  place(createNode(skills.A2, '#ff4d4f', '➤'), 140, 150);
  place(createNode(skills.A3, '#ff4d4f', '💥'), 40, 260);
  place(createNode(skills.A4, '#ff4d4f', '⚔'), 240, 260);

  place(createNode(skills.D1, '#2ecc71', '🛡'), 120, 40);
  place(createNode(skills.D2, '#2ecc71', '⬣'), 60, 180);
  place(createNode(skills.D3, '#2ecc71', '⛨'), 10, 300);
  place(createNode(skills.D4, '#2ecc71', '🌿'), 200, 300);

  place(createNode(skills.U1, '#49a6ff', '⚡'), 120, 40);
  place(createNode(skills.U2, '#49a6ff', '🏃'), 60, 180);
  place(createNode(skills.U3, '#49a6ff', '🌀'), 10, 300);
  place(createNode(skills.U4, '#49a6ff', '🔧'), 200, 300);

  // draw edges
  Object.values(skills).forEach(s => {
    const from = nodes[s.id];
    s.requires.forEach(req => {
      const reqNode = nodes[req];
      const line = document.createElement('line');
      const svg = panes[s.tree].svg;
      const [x1, y1] = centerPos(reqNode, svg);
      const [x2, y2] = centerPos(from, svg);
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.classList.add('std-edge');
      svg.appendChild(line);
    });
  });

  // interaction
  Object.values(nodes).forEach(n => {
    n.addEventListener('click', () => {
      const skill = skills[n.dataset.id];
      if (player.unlocked.has(skill.id)) {
        if (!player.refund(skill, skills)) {
          flash('Cannot refund');
          return;
        }
      } else {
        if (!player.unlock(skill)) {
          flash('Prerequisite or point requirement not met');
          return;
        }
      }
      refresh();
    });
  });

  function refresh() {
    pointsLabel.textContent = `Skill Points: ${player.points}`;
    Object.values(nodes).forEach(n => {
      const skill = skills[n.dataset.id];
      const unlocked = player.unlocked.has(skill.id);
      n.classList.toggle('unlocked', unlocked);
      const available = player.canUnlock(skill);
      n.classList.toggle('available', available && !unlocked);
    });
  }

  function flash(msg) {
    // lightweight alert
    console.warn(msg); // eslint-disable-line no-console
  }

  refresh();
}

// helper to make a pane with header, inner container and SVG for edges
function makeTreePane(title, color) {
  const wrapper = document.createElement('div');
  wrapper.className = 'std-wrapper';
  const hdr = document.createElement('div');
  hdr.textContent = title;
  hdr.className = 'std-header';
  hdr.style.color = color;
  const inner = document.createElement('div');
  inner.className = 'std-inner';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('std-svg');
  wrapper.appendChild(hdr);
  wrapper.appendChild(inner);
  wrapper.appendChild(svg);
  return { wrapper, inner, svg };
}

function centerPos(node, svg) {
  const rect = node.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const x = rect.left - svgRect.left + rect.width / 2;
  const y = rect.top - svgRect.top + 24; // circle center
  return [x, y];
}

export { PlayerState, Skill };

// Simple skill tree example with three branches: attack, defence and utility.
// Each branch is a small linear tree where unlocking a child requires the parent.

// Generic node factory for building tree nodes.
function node(data, children = []) {
  return { ...data, children };
}

// Convenience helper to flatten a branch into a linear list. This mirrors the
// approach used in player.js so it can be consumed by existing UI code.
function flattenBranch(branch) {
  const abilities = [];
  (function traverse(n, parent = -1) {
    const { children = [], ...data } = n;
    const idx = abilities.length;
    abilities.push({ ...data, parent });
    children.forEach(child => traverse(child, idx));
  })(branch);
  return abilities;
}

// Define the simple skill tree structure.
const simpleSkillTreeGraph = {
  attack: node({ name: 'Attack' }, [
    node({ name: 'Quick Jab', desc: 'Increase attack speed by 5%.', bonus: { atkSpd: 5 }, cost: 1 }, [
      node({ name: 'Heavy Swing', desc: 'Increase damage by 10%.', bonus: { dmgPct: 10 }, cost: 2 }, [
        node({ name: 'Overpower', desc: 'Critical hits deal 20% more damage.', bonus: { critDmg: 20 }, cost: 3 })
      ])
    ])
  ]),
  defence: node({ name: 'Defence' }, [
    node({ name: 'Toughness', desc: 'Increase max HP by 10%.', bonus: { hpPct: 10 }, cost: 1 }, [
      node({ name: 'Iron Will', desc: 'Reduce damage taken by 5%.', bonus: { dmgRed: 5 }, cost: 2 }, [
        node({ name: 'Guardian', desc: 'Increase armor by 10%.', bonus: { armorPct: 10 }, cost: 3 })
      ])
    ])
  ]),
  utility: node({ name: 'Utility' }, [
    node({ name: 'Fleet Foot', desc: 'Increase movement speed by 5%.', bonus: { speedPct: 5 }, cost: 1 }, [
      node({ name: 'Adrenaline', desc: 'Regenerate 1 stamina per second.', bonus: { stamRegen: 1 }, cost: 2 }, [
        node({ name: 'Evasion', desc: 'Increase dodge chance by 5%.', bonus: { dodge: 5 }, cost: 3 })
      ])
    ])
  ])
};

// Export a flattened representation for easy consumption.  Each branch's
// abilities array should start at the first unlockable skill rather than the
// branch label itself, mirroring the structure used by the main game logic.
const simpleSkillTrees = {
  attack: {
    display: simpleSkillTreeGraph.attack.name,
    abilities: flattenBranch(simpleSkillTreeGraph.attack.children[0])
  },
  defence: {
    display: simpleSkillTreeGraph.defence.name,
    abilities: flattenBranch(simpleSkillTreeGraph.defence.children[0])
  },
  utility: {
    display: simpleSkillTreeGraph.utility.name,
    abilities: flattenBranch(simpleSkillTreeGraph.utility.children[0])
  }
};

export { simpleSkillTreeGraph, simpleSkillTrees, node, flattenBranch };

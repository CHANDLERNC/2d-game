#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync } from 'fs';
import path from 'path';

const armorDirs = {
  helmet: ['headgear_set_01', 'headgear_set_03'],
  chest: ['breastplates_set_03'],
  legs: ['pants_set_3', 'pants_set_4'],
  feet: ['boots_300-399', 'boots_400-479'],
};

function collect(dir, rel) {
  return readdirSync(dir).flatMap(f => {
    const full = path.join(dir, f);
    const r = path.posix.join(rel, f);
    if (statSync(full).isDirectory()) return collect(full, r);
    if (f.endsWith('.png')) return [r];
    return [];
  });
}

const manifest = {};
for (const [slot, dirs] of Object.entries(armorDirs)) {
  manifest[slot] = dirs.flatMap(d => collect(path.join('assets', d), d)).sort();
}

writeFileSync(path.join('assets', 'armorManifest.json'), JSON.stringify(manifest, null, 2));

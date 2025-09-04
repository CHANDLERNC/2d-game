#!/usr/bin/env node
import { readdirSync, statSync, writeFileSync } from 'fs';
import path from 'path';

const baseDir = path.join('assets', 'weapons');

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
for (const type of readdirSync(baseDir)) {
  const dir = path.join(baseDir, type);
  if (statSync(dir).isDirectory()) {
    manifest[type] = collect(dir, `weapons/${type}`).sort();
  }
}

writeFileSync(path.join('assets', 'weaponManifest.json'), JSON.stringify(manifest, null, 2));

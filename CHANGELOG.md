# Changelog
All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with date-based entries.

## [Unreleased]
### Added
- Random treasure chests (2–5 per floor) spawn around the map with loot.
- Chests now have a rare chance to be mimics that ambush the player.
- Optional cellular‑automata cave floors with secret rooms and environmental hazards like spike traps and lava.
- Animated tiles for lava pools and spike traps.
- Project license clarifying sole ownership.
- Berserker and Spellbinder player classes with unique stat bonuses.
- Player magic system with three ability trees and Q-bound spells.
- Additional spells added to each magic tree.
- Berserker skill tree with 12 abilities and escalating point costs.
- Stamina resource and Raging Strike ability for the Berserker class.
- Additional Berserker stamina abilities: Blade Cyclone and Thunder Bash.
- Random weapon name generator for unique gear titles.
- Gear now uses expanded name generators with more fantasy prefixes, suffixes, and unique weapon titles like "Shadow's Bane".
- Weapon damage-over-time affix that can ignite foes.
- Melee weapon classes now inflict bleed damage over time.
- New weapon affixes: attack speed, knockback, and projectile pierce.
- Weapons can roll up to four stacking damage-over-time attributes.
- Armor can roll up to five defensive affixes.
- Additional armor classifications (Cloth, Leather, Heavy Leather, Chain Mail, Plate, Heavy Plate) with defensive buffs.

- Consumable potions appear in loot and shop inventories.
- Legendary rarity added for gear and weapon drops.
- Distinct loot icons per item class with glow effect for rare+ drops.
- Rotating gold coin animation for dropped loot.
- Uncommon rarity tier and revamped color scheme; rarer weapons gain stronger stats and glow from Rare upward.
- Rotating chest armor loot icon with rarity glow.
- Torches now cast light, revealing nearby tiles for increased visibility.
- Subtle floor and wall color variations between floors for greater variety.
- Griffin, dragon, and snake boss variants.
- Red and yellow slime variants with unique stats, plus new mage and bat color schemes.
- Added blue, purple, and shadow slime variants; the shadow slime teleports near players before attacking.
- Animated dragon boss idle sprite sheet and generic frame-based monster animation.
- Animated bat idle sprite with flapping wings.
- Fire and poison skeleton variants that inflict burn or poison damage.
- Passive health regeneration when out of combat.
- Animated projectile sprites for elemental arrows and magic bolts.
- Weighted monster spawning tied to player strength with elite variants that gain unique abilities.

### Changed
- Dungeon room connections now use a spanning tree with extra corridors for more varied layouts.
- Split single-file build into modular assets for GitHub Pages.
- Replace floor and wall textures with procedurally generated patterns to drop binary images.
- Reworked audio system with crossfading music and separate SFX volume control.
- Monster spawn counts are now randomized and increase on deeper floors.
- Recombined CSS and JavaScript into `index.html` to maintain a single-file distribution.
- Expanded spell and projectile aiming to support more precise directions.
- Increased player starting health by 50 points.
- Reduced base health of all monster types.
- Magic abilities now require sequential unlocking with escalating point costs.
- Reworked class skill trees into nested data structures and updated progression logic.
- Reworked weapon and armor attributes for improved random bonuses.
- Reduced monster density on early floors.
- Increased XP reward per monster by 25%.
- Reduced wizard spawn chance on lower floors.
- Increased potion drop rate to 40% (from 25%).
- Mage enemies now fire 30% slower but hit 10% harder.
- Increased level-based weapon damage scaling to keep pace with mid-floor monster health.
- Mage enemies now use an animated skeleton sprite with purple energy.
- Snake boss now uses an image sprite with a simple bobbing idle animation.
- Enemy elemental resistances now scale with floor level.
- Mini bosses now always drop gold and may also drop gear or weapons.
- Berserker abilities now unlock sequentially on the skill tree and bind to Q instead of using modifier keys.
- Adjusted special ability damage scaling for Spellbinder and Berserker classes, weakening early skills and strengthening later unlocks.
- Rebalanced loot rarity distribution to favor common and uncommon gear and increased bonuses on rare items.
- Mini bosses and bosses now appear at twice the size of normal monsters.
- Replaced dragon and dragon hatchling sprites with a bone dragon sporting blue flames.
- Health and mana potions now use custom SVG sprites with rarity glow and a simple rotation animation.
- Weapon damage and armor/resistance values now scale with item level and rarity. Player base resistances increase slightly each level.
- Gear slot drops now balance weapons and armor with dynamic weighting and floor-based scaling.
- Increased weapon and armor stat scaling beyond floor 25 to keep pace with high-level monsters.

### Removed
- Blue slime enemy variant.

### Fixed
- Slime idle animations now render without missing image assets.
- Melee attacks now track the mouse and register hits within a 35° cone (2-tile reach by default).
- Berserker class no longer registers as a Spellbinder.
- Berserker skill menu now displays ability descriptions.

### Docs
- Document multi-file layout and link to the standalone controls page from the start screen.

## 2025-08-26
### Added
- Directional player attacks and a full projectile system (per-weapon reach/cooldowns; melee vs. ranged profiles). (27799af)
- Elemental status effects for attacks/projectiles. (a4db992)
- Advanced monster AI with scaling and projectile behavior. (1562148)
- Caster/mage enemy with elemental resistances. (7d91d88)
- Respawn UI message after player death. (e8b8f66)
- Expanded loot pool with more item types. (b484bd9)

### Changed
- Differentiated monster health pools by type. (5df508b)
- Slower global enemy movement via speed multiplier; limited monster aggro and improved movement. (5a53ad8, 5dd70bb)

### Fixed
- Enabled consistent left-click attack. (26dc9b7)
- Prevented monsters from overlapping the player (fixes hit-registration issues). (48121da)

*(See the Aug 26 commit list for merged PRs #19–#29 that introduced these features and fixes.)*

## 2025-08-25
### Added
- Initial single-file HTML5 dungeon game with inline sprites. (9a70473)
- Merchant (shop) and player leveling systems. (e17661d)
- Textured floor & wall patterns. (4f90a35)

### Changed
- Expanded canvas to fill the viewport. (95285b5)
- Lightened floor tile color for readability. (b5b546a)

### Fixed
- Inventory open/toggle reliability. (0f6d062)

---
## Conventions / Next Steps
- Consider tagging the current state as `v0.1.0` (then future releases can use `v0.1.1`, etc.).
- Keep sections grouped as **Added / Changed / Fixed / Docs**.
- Prefer Conventional Commits (`feat:`, `fix:`, `docs:`) in messages to automate release notes later.

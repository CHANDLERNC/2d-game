# Changelog
All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with date-based entries.

## [Unreleased]
### Added
- Project license clarifying sole ownership.
- Warrior and Mage player classes with unique stat bonuses.
- Player magic system with three ability trees and Q-bound spells.
- Additional spells added to each magic tree.
- Warrior skill tree with 12 abilities and escalating point costs.
- Stamina resource and Power Strike ability for the Warrior class.
- Additional warrior stamina abilities: Whirlwind and Shield Bash.
- Random weapon name generator for unique gear titles.
- Weapon damage-over-time affix that can ignite foes.
- Melee weapon classes now inflict bleed damage over time.
- New weapon affixes: attack speed, knockback, and projectile pierce.

- Consumable potions appear in loot and shop inventories.
- Legendary rarity added for gear and weapon drops.
- Distinct loot icons per item class with glow effect for rare+ drops.
- Uncommon rarity tier and revamped color scheme; rarer weapons gain stronger stats and glow from Rare upward.

### Changed
- Recombined CSS and JavaScript into `index.html` to maintain a single-file distribution.
- Expanded spell and projectile aiming to support more precise directions.
- Increased player starting health by 50 points.
- Reduced base health of all monster types.
- Magic abilities now require sequential unlocking with escalating point costs.
- Reworked weapon and armor attributes for improved random bonuses.
- Reduced monster density on early floors.
- Increased XP reward per monster by 25%.
- Reduced wizard spawn chance on lower floors.
- Increased potion drop rate to 40% (from 25%).
- Mage enemies now fire 30% slower but hit 10% harder.
- Enemy elemental resistances now scale with floor level.
- Warrior abilities now unlock sequentially on the skill tree and bind to Q instead of using modifier keys.
- Adjusted special ability damage scaling for Mage and Warrior classes, weakening early skills and strengthening later unlocks.

### Fixed
- Melee attacks now track the mouse and register hits within a 35° cone (2-tile reach by default).
- Warrior class no longer registers as a mage.
- Warrior skill menu now displays ability descriptions.

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

# Changelog
All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with date-based entries.

## [Unreleased]
### Added
- Random weapon name generator for unique gear titles.
- Consumable potions appear in loot and shop inventories.
- Legendary rarity added for gear and weapon drops.
### Changed
- Increased player starting health by 50 points.
- Reduced base health of all monster types.
- Reworked weapon and armor attributes for improved random bonuses.

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

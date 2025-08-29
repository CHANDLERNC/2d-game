# 2D Dungeon Game

An offline HTML5 dungeon crawler with inline sprites, now featuring Berserker, Spellbinder and Nightblade classes, a Berserker skill tree, consumable potions and legendary gear.

Recent updates rework the audio system with smoother sound effects and dynamic music that cross‑fades between calm, combat and boss themes.

The game now auto-saves your current floor and equipped gear to local storage when you leave the page. Use the pause menu to manually save or load this progress.

## Play the Game
Open `index.html` in your browser.  
For full functionality, serve the directory with a local server:

```bash
python -m http.server
```

Then visit [http://localhost:8000](http://localhost:8000).

## Controls
- **WASD or Arrow Keys** – Move in eight directions
- **I** – Toggle inventory
- **K** – Toggle magic or skills menu
- **L** – Toggle skills menu
- **Q** – Use bound ability (spell or skill)
- **E** – Use portal or the merchant
- **1/2/3** – Quick-use potion from potion bag slot 1–3
- **Esc** – Close open menus or open pause menu
- **Click monsters** – Attack

See [`controls.html`](controls.html) for a standalone controls page.

## Development Notes
 - Game logic now lives in `game.js` and styling in `style.css`, keeping `index.html` focused on layout.
 - Constants such as tile sizes and game balance are defined near the top of the script for quick tweaking.

## Assets
All runtime textures and sprites are generated in `assets/sprites.js` and exposed via a global `ASSETS` object.  Textures are
available under `ASSETS.textures` and character or item sprites under `ASSETS.sprites`, making it simple to swap or modify
graphics without digging through game logic.

## Contributing
1. Fork and clone the repository.
2. Create a branch for your feature or fix.
3. Update `index.html` or other relevant files and ensure the game still runs.
4. Submit a pull request describing your changes.

Contributions should remain self-contained and avoid external dependencies.


## License
This project is proprietary and solely owned by the project owner. Use, reproduction, or distribution requires explicit permission.
# 2D Dungeon Game

An offline single-file HTML5 dungeon crawler with inline sprites, now featuring class selection, consumable potions and legendary gear.

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
- **K** – Toggle magic menu
- **Q** – Cast bound spell
- **E** – Use stairs or the merchant
- **1/2/3** – Quick-use potion from potion bag slot 1–3
- **Click monsters** – Attack

## Development Notes
- The project is contained in a single HTML file (`index.html`) with inline JavaScript and no build step.
- Constants such as tile sizes and game balance are defined near the top of the script for quick tweaking.

## Contributing
1. Fork and clone the repository.
2. Create a branch for your feature or fix.
3. Update `index.html` or other relevant files and ensure the game still runs.
4. Submit a pull request describing your changes.

Contributions should remain self-contained and avoid external dependencies.

# 2D Dungeon Game

An offline HTML5 dungeon crawler with inline sprites, now featuring class selection, a warrior skill tree, consumable potions and legendary gear.

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
- **L** – Toggle warrior skills
- **Q** – Use bound ability (spell or warrior skill)
- **E** – Use stairs or the merchant
- **1/2/3** – Quick-use potion from potion bag slot 1–3
- **Click monsters** – Attack

See [`controls.html`](controls.html) for a standalone controls page.

## Development Notes
- All game logic, styling, and assets live inline within `index.html` to keep the project self-contained.
- Constants such as tile sizes and game balance are defined near the top of the script for quick tweaking.

## Contributing
1. Fork and clone the repository.
2. Create a branch for your feature or fix.
3. Update `index.html` or other relevant files and ensure the game still runs.
4. Submit a pull request describing your changes.

Contributions should remain self-contained and avoid external dependencies.


## License
This project is proprietary and solely owned by the project owner. Use, reproduction, or distribution requires explicit permission.
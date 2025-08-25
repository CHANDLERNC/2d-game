# 2D Dungeon Game

A single-file HTML5 dungeon crawler.

## Play the Game
1. Start a local server in the repository root:
   
   ```bash
   python -m http.server
   ```
   
   Then open [`Main code base stable`](Main%20code%20base%20stable) in your browser (e.g. http://localhost:8000/Main%20code%20base%20stable).
   
   You can also open the file directly, but some browsers block features when loaded from `file://`.

## Controls
- **WASD or Arrow Keys** – Move in eight directions
- **I** – Toggle inventory
- **E** – Use stairs or portals
- **Click monsters** – Attack

## Development Notes
- The project is contained in a single HTML file (`Main code base stable`) with inline JavaScript and no build step.
- Constants such as tile sizes and game balance are defined near the top of the script for quick tweaking.
- Earlier versions of the codebase are kept as `base code` and `updated code` for reference.

## Contributing
1. Fork and clone the repository.
2. Create a branch for your feature or fix.
3. Update `Main code base stable` or other relevant files and ensure the game still runs.
4. Submit a pull request describing your changes.

Contributions should remain self-contained and avoid external dependencies.

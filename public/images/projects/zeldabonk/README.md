# ZeldaBonk preview media

Captured/exported on 26 November 2026 from https://zelabonk.vercel.app/ using the real rendered game UI.

- `menu.jpg`: title menu, Kokiri Forest, before starting the capture session's run.
- `gameplay.jpg`: Zelda with Light Arrows in the Great Sea Training Grounds, with practice rivals spawned through the normal controls.
- `sealing-power.jpg`: Zelda using Sealing Power in that training arena.
- `map-*.jpg`: all eight realms selected through the title menu's Realm picker. Locked campaign labels are left visible; these are menu previews, not a claim of completed/unlocked saves.
- `character-*.png`: all eleven original PNG portraits exported from the rendered hero roster's image elements, including locked characters. The game offers every hero in Training Grounds. PNG transparency and the original 112 × 112 dimensions are preserved.

Screenshots use the browser's actual 657 × 559 viewport, saved as JPEG without fabricated scenes or edits. No generated artwork or invented gameplay screenshots are used. Zelda characters belong to their respective rights holders; this is an unofficial fan portfolio and game, not Nintendo endorsement.

`character-*-walk.png`: eight original walk frames at 10 fps, exported from the live game’s `art.js` `RelicArt.canvas('hero', id, 0, frame, 'walk')` renderer on 26 November 2026. Each transparent sheet is 896 × 112 pixels. Hover/focus plays five cycles, stops on exit, and follows the shared motion preference. No game runtime or Three.js dependency is loaded for these previews.
Darunia's static portrait was also refreshed from the current live art renderer (idle frame zero) to match his walk frames.

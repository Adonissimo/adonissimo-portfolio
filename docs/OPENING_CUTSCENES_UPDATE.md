# Opening cutscenes — 3.13.1

## Cleanup patch and operator evidence

The operator's 3.13.0 Windows report passes all 115 tests, TypeScript and the Next production build, but the zero-warning lint gate fails on a ref read in dialog cleanup. Version 3.13.1 captures the stable `exitIntent.current` object during effect setup and reads that object during cleanup. Enter/Skip continue to mutate its fields; they do not replace it. This avoids capturing stale booleans and preserves the final focus restoration and arrival event. No lint rule is disabled. `/supabase/.temp/` is also ignored to keep copied CLI-local state out of commits.

The patched source passes 115 Node tests and the nine actual-component opening scenarios here. Those scenarios cover the latest mutable intent after Enter and Skip, cleanup/replay and focus/arrival behavior. ESLint, semantic TypeScript and the production build still need a local rerun on this patch; the earlier operator results do not certify the new version. The terminal should now print **3.13.1**.

This update adds the two sequences requested by Lorenz, preserving the existing Zelda world and portfolio.

## Flow

| Moment | Duration | Picture and action |
| --- | --- | --- |
| Before the title | 4.8 seconds | Camera moves across Hyrule fields, crossfades to the sky island and reveals a carved crest. Two short captions move with the shots. |
| The Legend of Adonissimo | Until Enter | The existing title, fairy, murals, forest prelude and entry controls appear after the prologue. |
| After Enter | 2.6 seconds | The camera travels toward the sky gateway while stone-ring geometry draws and a new caption appears. |
| Arrival | 820ms | The existing white/gold Triforce expands through one light swell and reveals the portfolio. |

The films use the existing `hyrule-fields.png` and `sky-island.png`, optimized through Next Image. No movie download, generated artwork or animation package was added. The same sky image is reused for both films. Only the active title/film is mounted. Existing foreground fog and the continuously fluttering fairy stay in the native dialog.

## Controls and sound

- Skip to title, or Escape during the prologue, goes immediately to the waiting title.
- Skip opening, or Escape at the title, goes immediately to the portfolio.
- Skip to portfolio, or Escape after Enter, ends the entry film without waiting for the flash.
- Enter silently plays the visual entry sequence while stopping the forest prelude and disabling interaction effects, retaining the previous silent-entry behavior.
- Normal Enter stops forest audio, invokes Zelda's Lullaby and the opening cue synchronously from the click, and allows one preference-respecting shrine cue at the Triforce arrival. Skipping cancels remaining effects; it does not stop already requested background music.
- The forest loop retains the owner's autoplay request. Browser autoplay policy may require the existing trusted-gesture retry. There is no new forest sound button.
- Hidden tabs pause CSS and the remaining film time. Repeated Enter cannot restart the entry film. Unmount/Strict Mode cleanup cancels timers, restores body scrolling, releases the fairy host and closes the dialog.
- A manual local motion-off preference skips timed movement while preserving the waiting welcome. The owner's full-motion default remains unchanged.
- A fresh home load or Replay welcome runs the prologue. Internal navigation does not repeatedly show it. Section deep links still bypass the automatic opening.

## Evidence

- 115 Node tests pass, including six new tests covering phase order, a waiting title, duplicate Enter, hidden-tab pause, stale callbacks, skip in every phase, manual motion off and cleanup/resubscription.
- 137 TS/TSX/MJS source files pass syntax transformation. This is not TypeScript semantic checking.
- Actual-component execution with hook/DOM doubles passes nine scenarios: ordinary entry, silent entry, prologue skip, entry skip, Escape, hidden tab, Strict Mode replay, manual motion off and an unavailable native dialog.
- Seven foreground-fog lifecycle scenarios pass after extending reading measurements to the film captions and identity.
- TypeScript, ESLint and the Next production build are blocked here because dependencies are absent. No blocked installation was retried.
- There is no current browser available here. Mobile/desktop paint, real focus behavior, contrast, frame rate and listening still require local review. Source tests do not prove those outcomes.

## Apply and preview on Windows

Stop the development server with Ctrl+C before merging the complete ZIP. Preserve your `.env.local`, existing lockfile and installed dependencies. Then run:

```powershell
npm.cmd run check
npm.cmd run dev
```

Open `http://localhost:3000/` in a fresh tab or reload Home. The terminal should identify version **3.13.0**. The footer's Replay welcome also starts the prologue.

Check the full flow on a phone-sized viewport and a desktop, then try skipping during both films, silent entry, and hiding/restoring the tab. After entry, confirm project links, page turns, the fairy and music controls still work. This ZIP does not update Vercel automatically.

# Fairy, mist, murals and Triforce entry — 3.10.0

The opening previously switched to a static native fairy cursor. Its native dialog sits in the browser's top layer, above the ordinary fixed cursor sprite. Raising a normal `z-index` cannot put that sprite above a modal dialog.

## Animated fairy before entry

The shared cursor now renders through a React portal inside the open welcome dialog. It keeps the same single 28-light pool, pointer alignment and wing animation: slow 750ms idle half-cycles, speeding up with pointer movement down to a bounded 90ms. On dialog cleanup it returns to the page. A host-ownership store handles repeated cleanup and avoids restoring disconnected dialogs. This does not add a second cursor, remove native modality or make decorative elements intercept clicks.

Native text/form controls and touch exclusions remain. An unrelated modal that has not registered a host still has a visible native cursor fallback. The full-motion default and ambient pause remain as requested.

## Fuller atmosphere and mural panels

The welcome now has four fog banks on desktop and three on compact devices. They drift at different speeds and depths across the upper, middle and lower scene, with stronger foreground mist near the bottom. Public pages use the same four/three layered arrangement behind content. Riverside and Depths get fuller environment-colored mist; private/neutral screens remain quieter. The existing leaves, light rays and hidden-document pause continue.

The fog is strongest at the edges and fades across the reading column; the welcome's fog also thins behind the central copy. These source masks protect readability without removing the atmosphere, but rendered contrast still needs the browser check below.

Following the owner's calm-motion refinement, rays move over 48-second legs with a small angular sweep. Mist drifts over 52–84-second legs, moving only 2% each way and 2px vertically, with gentle easing and little brightness variation. Different phases keep the atmosphere flowing without a synchronized surge. Mobile's overall atmospheric opacity varies only from 90% to 100% over 24 seconds. The deliberate Triforce entry keeps its separate 820ms timing.

Two mural wings frame the opening, using the existing transparent Zonai and Hyrule atlas PNGs with a muted stone treatment, carved geometric seals and familiar Zelda symbols. The center stays protected for the wordmark and controls, and mobile uses narrower, quieter panels. The images request eager loading when the opening mounts. Their source PNG bytes are unchanged.

A new mural illustration was attempted through the built-in image generator, which returned an account usage limit. No new illustration was generated, no API fallback/key was used and no generated mural is claimed. The shipped panels reuse the project's actual PNG artwork; they are original portfolio fan art, not official game mural screenshots.

## Enter flash

Enter and Enter silently now release a white/ivory Triforce with a yellow-gold edge. The crest grows from a small mark to a screen-filling scale while a single warm light swell illuminates the scene. The old rotating-cover exit is replaced by an opacity exit so the Triforce itself leads the transition. The exit lasts 820ms; route page turns keep their existing timings.

The flash plays once per entry. Skip/Escape remains immediate, with no mandatory flash. The actual button sound/music handoff is unchanged: forest audio stops before entry and the supplied Zelda's Lullaby starts only on Enter/Play. Browser autoplay restrictions still apply to the opening forest audio.

## Evidence and remaining checks

- 101 Node tests pass, including modal host ownership, stale cleanup and disconnected-host handling.
- 130 TS/TSX/MJS files transform without syntax errors. This is not semantic TypeScript checking.
- Isolated evaluation of the real components confirms that the fairy portals into the opening and keeps both speed-responsive and idle animation; cleanup releases its host/listeners. Opening tests retain trusted audio retry, Enter/Skip handoff and Strict Mode cleanup behavior. Mural source paths and decorative semantics are checked.
- Existing desktop/mobile menu, dock, route motion, content/loading and backend authorization source checks remain passing.
- Backend/API/database code, dependency declarations and existing PNG/audio bytes are unchanged.

The current workspace still lacks installed React/Next/TypeScript/ESLint tooling and a usable browser. The complete build, real modal paint/focus, ray/mist contrast, animation frame rate and actual audio playback remain local gates. No Vercel deployment or Phase 4 live-service acceptance was performed.

## Try the update

Extract the complete ZIP over the project, keeping `.env.local` and `package-lock.json`. Then run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

Open http://localhost:3000 and use Replay welcome if needed. Move the mouse around the opening and stop: wings should speed up, then return to a slow flutter without becoming static. Check typing controls, Enter/Enter silently, immediate Skip/Escape, portrait/landscape, day/night page mist, audio handoff and no horizontal overflow. Publish through your existing Vercel workflow after local checks pass; extracting the ZIP does not update Vercel automatically.

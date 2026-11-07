# Adonissimo storybook effects

Version 2.1.0 removes the sound picker and applies randomized effects automatically to interactions across the site. Zelda’s Lullaby continues playing in background tabs as before.

## Interaction behavior

- Buttons, links, menus, native disclosures, dropdown changes, checkboxes and radio buttons draw a random effect from the 18-cue set. This includes public pages and the Phase 3 dashboard.
- Every cue is drawn once before the set refills. Consecutive interactions never repeat the same cue, including across a refill.
- The cinematic welcome keeps its opening harp/paper cue. Enabling effects keeps its short confirmation cue.
- Keyboard and touch activation follow the same paths. Hover, focus, typing, scrolling and page load are silent.
- Disabled controls, the current journal filter, sound/music controls and explicitly silent controls are excluded. Muting never produces an extra sound.
- Automatic effects are rate-limited to one accepted interaction per 180ms. The synth permits at most three overlapping short cues.

The dock retains effects on/off and volume independently of music. Enter silently turns effects off and pauses music. The welcome checkbox can choose effects before entry. There is no selection or preview gallery.

## Source map

| File | Responsibility |
|---|---|
| `lib/sound-effects.ts` | Cue catalog, random draw bag, repeat prevention, preferences and throttling |
| `lib/story-sound-synth.ts` | Original bounded paper, harp, bell, rupee and rune audio graphs |
| `components/sound-effects.tsx` | Global activation/change listeners and simple effects controls |
| `lib/music-session.ts` | Continuous user-started background music and optional media keys |
| `components/storybook-transition.tsx` | Interruptible decorative page leaf |
| `app/storybook.css` | Book materials and sound-control styling |

`playInteraction()` selects random cues. `play(cue)` remains for authored entry/confirmation moments. `data-sfx="none"` silences controls or containers. Other cue hints identify meaningful activations but ordinary interactions choose randomly. The sound catalog contains 18 original generated effects, not Nintendo samples.

The sound engine is created/resumed in the activating event. No context is created on mount. Only enabled/volume preferences are stored, independently of the music preferences. Hiding the tab stops interaction sounds while the music continues. Returning does not start new sounds. Reduced motion affects visual transitions, independently of sound preferences.

## Local acceptance

1. Open public pages and the dashboard. Confirm the sound picker is absent and mute/volume remain.
2. Click links, buttons, menus and pagination, then change technology/status dropdowns and checkboxes. Listen for varied cues without having to pick them.
3. Use keyboard and touch activation. Hovering, focus and typing should stay silent.
4. Repeat interactions at a normal pace: all 18 sounds should be available without adjacent repeats. Rapid clicking should stay bounded.
5. Mute effects and change volumes; controls must remain silent and navigation must still work. Enable effects explicitly to resume interaction audio.
6. Switch tabs during music playback: music continues, interaction tails stop, and returning starts no new cue.

63 Node tests passed, including random draw coverage, repeat prevention at refill, rapid-click/mute/zero-volume gating, and boundary random values. These tests simulate audio and do not replace real browser playback or responsive visual review. Dependency installation remains blocked by registry HTTP 403; full build, lint, semantic typecheck and browser checks remain pending locally.

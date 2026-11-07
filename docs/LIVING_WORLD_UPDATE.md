# Living world and motion repair — 3.8.0

## Why the previous animations could disappear

The earlier code returned a reduced mode whenever the operating system requested it. Five stylesheets also contained unconditional reduced-motion rules, including a global animation/transition shutoff and a hidden book overlay. A browser with that preference could therefore suppress the effects despite the owner's request for full motion. Blocked preference storage also made the bootstrap set motion off. The report establishes that the previous experience did not work for the user; the user's exact OS/browser preference was not independently inspected.

This edition makes full motion explicit. Bootstrap and the hydrated store agree on `data-motion="on"` even with an OS reduced preference or denied storage. The CSS media-query fallbacks no longer override that explicit choice. Historical off values from the retired toggle are not inherited by the new preference key. An explicit current local off value still works; no global reduced-motion control is added. This owner-requested behavior supersedes earlier project guidance to always let the OS reduce motion.

## Entry, navigation and scroll

Enter and Enter silently now signal an actual magical arrival after the cover leaves: main content, headings and pictures move, and the rune/twelve-spark effect is triggered without another opaque leaf over Home. The old cleanup could also announce an arrival during a development Strict Mode rehearsal. A committed exit intent now separates real entry from rehearsal, replay/unmount and Skip. Skip/Escape remain immediate.

The directional route choreography and semantic paper/bell effects from 3.7.0 remain. Scroll reveals now watch public sections, project/content entries, illustrations, biography and prose. A MutationObserver adopts streamed/fetched content. Intersections behind the Home welcome do not consume a reveal; Enter re-arms those targets. A 64-target cap, one-time reveals, cleanup and visible-by-default content bound the work. No fake loading or animation delay is added to data requests.

## A living background and fairy

- A deterministic pool of 28 leaf/mote elements runs behind the content. Phone CSS shows at most 14; quiet/private pages show at most eight. Fields/sky use drifting leaves; workshop/Depths emphasize motes. The background painting slowly breathes and has a bounded 12px scroll drift.
- Ambient effects begin after the Home welcome, pause in hidden documents and remain independent of music playback. In the expanded music dock, **Ambient effects** pauses/resumes the background and fairy effects without turning off page transitions, sound effects or music. The dock still starts minimized.
- On a fine desktop pointer, the native cursor uses an original 32px winged fairy-orb SVG with an exact center hotspot and normal browser fallback. Text inputs retain their I-beam; checkboxes/ranges/selects retain suitable native pointers. The SVG is a small interface icon, not a replacement illustration.
- A fixed pool of 28 noninteractive lights leaves a fading 680ms trail. Movement is throttled, stationary/typed input creates no trail, and blur/unmount/hidden state cancels animations. Touch devices do not receive a fake cursor. Particle positions are deterministic at render time; there is no random SSR/client discrepancy.

The ambient leaves and light motes are lightweight CSS geometry, not additional raster downloads. All existing theme paintings remain PNG source assets. The cursor and other interface geometry remain vector/code.

## Restored footer

The wide composition from the first screenshot is restored, including the small realm relic on public desktop pages. It uses the original full-size PNG paintings, not the two tiny centered islands. The banner is 86px high on desktop and 66px on phones. It follows the route's realm. The original sky painting retains its painted background; its PNG format does not imply that background was extracted. No new image generation was required. Foreground heading cutouts and the five page backgrounds remain separate.

## Verification and limits

The source suite has 95 passing tests. New coverage checks full motion under the OS reduced preference, bootstrap/storage failure consistency, deterministic particle limits, environment selection, preference persistence/notifications and independence from audio preferences. Real TSX evaluation with browser doubles exercises Enter, Skip, Strict Mode rehearsal, scroll/stream observers, actual content/image animation targets, the rune/spark event, ambient activation and cursor pool/cleanup. All 126 TS/TSX/MJS sources pass syntax transformation. A source selector check confirms that all five reduced-preference CSS blocks preserve explicit full motion; the 32px cursor SVG validates without external references. These are source/lifecycle checks, not semantic TypeScript, a running-browser animation, native-cursor, audio-listening or performance test.

The full semantic TypeScript/ESLint/Next build, the installed lint dependency probe/audit, and real desktop/mobile/theme/input checks still need the operator computer because dependency/browser downloads are blocked here. The earlier supplied passing build was 3.5.0. No Vercel deployment, database operation or real email occurred in this update. The 3.6.1 scoped lint patch remains included and unconfirmed after installation.

## Apply and inspect

Stop the existing dev server with Ctrl+C. Merge the full ZIP into the project, preserving `.env.local`, `package-lock.json` and independent local edits. Then run:

```powershell
Set-Location 'C:\Users\ljsalvador\Downloads\Lorenz Portfolio\zelda-portfolio'
npm.cmd install
npm.cmd audit
npm.cmd run check
npm.cmd run dev
```

Confirm the terminal version is **3.8.0** and open `http://localhost:3000`. A hard refresh ensures the new application code is loaded. Enter the welcome, scroll, navigate between chapters and move the mouse over the background or links. The wide PNG footer should be back; text/art/runes should move, leaves/motes should drift and the fairy should leave light behind it. Try the dock's ambient pause, a text field, rapid navigation and a hidden tab. Test the localhost update before deploying it; a prior Vercel deployment is a separate copy of the source.

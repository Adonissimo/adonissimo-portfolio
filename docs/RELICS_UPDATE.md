# Relics and selective loading — 3.4.0

## Visual changes

Four matching original PNG illustrations add recognizable Zelda details around the existing realm scenery:

| Source asset | Placement |
| --- | --- |
| `public/images/ornaments/hero-relics.png` | Home sky-island artwork and its public footer |
| `public/images/ornaments/zonai-relic.png` | Projects/auth chapter scenery, public project footer and a wide-screen Home margin |
| `public/images/ornaments/silent-princess.png` | About/Contact chapter scenery, Home About artwork and field footers |
| `public/images/ornaments/lightroot.png` | Field-notes chapter scenery and its public footer |

The cutouts have real transparency, intrinsic dimensions of 1254 by 1254, decorative semantics and responsive Next Image sources. They are non-draggable and cannot intercept input. Smaller screens reduce their footprint; the outer-margin relic and footer cutouts are hidden where there is no room. Placement uses the existing artwork space, with no additional full-height sections. Actual CMS covers retain priority over fallback scenery.

The four original PNGs total 4,443,768 bytes before framework optimization. This is a source-file total, not measured browser transfer. Existing scene artwork remains in WebP. PNGs were created with the built-in image-generation tool; no CLI fallback was used. Each exact prompt is in the corresponding `.prompt.txt` file and embedded in the PNG metadata, with provenance in `public/images/provenance.json`. They are original unofficial fan illustrations, not official Nintendo assets or project screenshots.

A fine geometric seal frames the Home and chapter scenery. On the existing welcome-arrival event, its Home strokes draw once over 1100 ms in full-motion mode. Project hover and keyboard focus add a restrained inset frame. Hidden tabs cancel decorative Web Animations and remove click flares; reduced motion registers no cinematic effects. Music playback still follows the existing user's playback intent.

## Where skeleton loading belongs

- Home's static introduction renders independently from the async project section. A Suspense fallback reserves a featured-project layout only while that section awaits its real query.
- Project and field-note routes keep their existing meaningful route skeletons.
- Collection searches and pagination retain existing results while fetching replacements, with an explicit updating message and `aria-busy`. A pending collection without results uses skeletons.
- The dashboard retains its actual loading skeleton and real error/retry behavior.
- Static About, Contact and auth content has no artificial delay. Skeletons have no repeating animation; decorative shapes are hidden from assistive technology, with a separate useful loading status.

This follows the documented React/Next pattern of lightweight initial fallbacks and keeping already revealed content available during updates. It does not add an experimental React API or another dependency.

References:

- https://nextjs.org/docs/app/api-reference/file-conventions/loading
- https://react.dev/reference/react/Suspense

## Verification

- The existing 83 Node regression tests pass.
- Syntax transformation succeeds for 118 TypeScript, TSX and MJS source files. This is not semantic type checking.
- Isolated component checks with hook/dependency doubles cover the immediate Home shell and project boundary, previous-result preservation, empty pending skeletons, one useful loading status, decorative asset paths/dimensions, main landmarks, planned-project links, private navigation and the minimized audio controls.
- Isolated DOM/animation doubles verify the bounded seal animation, hidden-tab cancellation, click-flare removal, listener cleanup and system-reduced-motion behavior. These are not real browser tests.
- PNGs were visually inspected and decoded, with genuine alpha and unchanged pixels after embedding provenance.
- TypeScript, ESLint, a production build, rendered desktop/mobile/day/night layouts, hydration, keyboard traversal and live image upload were not run here because the required installed dependencies/browser are unavailable. The operator's successful 3.3.1 gates precede this update.

## Apply and preview

Merge the complete ZIP into the existing project folder using the normal replace-files workflow. Keep local environment settings, the existing lockfile and any independent local edits. Run these from the folder containing `package.json`:

```powershell
npm.cmd install
npm.cmd run check
```

After all four gates pass:

```powershell
npm.cmd run start
```

Open http://localhost:3000 and leave the terminal running. Inspect Home, Projects, Field notes, About and Contact in day/night and phone/desktop layouts. Replay the welcome with motion enabled, then with system reduced motion. For loading checks, use browser network throttling: previous entries should remain during searches, and a genuinely pending empty collection should show placeholders. Fast or cached requests may not expose a visible skeleton. Check an authorized ordinary image upload after the Sharp upgrade.

The Sharp 0.35.5/type-import fix is retained. The 16 moderate minimatch/ESLint audit findings remain unresolved pending the operator's lockfile; this visual update does not suppress or certify them. No Vercel deployment was performed.

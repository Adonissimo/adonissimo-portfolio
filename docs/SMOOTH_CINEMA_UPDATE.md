# Smooth cinema — 3.14.0

Lorenz asks for smoother animation, more cinematic cutscenes and a stronger fantasy aura. This refines the existing Tears of the Kingdom direction and keeps the actual portfolio and backend flows intact. The separately requested Taste guide is unavailable in this environment; the work follows the interview-confirmed brand and available frontend design guidance.

## Motion direction

The focal moment remains the opening journey. A steady move through fields and sky leads into the title with an overlapping dissolve. Enter lets the title recede as the gateway camera begins, and the same camera continues beneath the Triforce arrival. Warm light and small gold/jade motes establish atmosphere within the existing PNG art.

| Moment | Timing | Continuity |
| --- | --- | --- |
| Field-to-sky prologue | 5.6 seconds | Slow camera crops and overlapping shots, with existing captions and identity. |
| Title dissolve | 800ms | The final prologue shot remains mounted beneath the incoming title. Enter and Skip can interrupt this transition. |
| Waiting title | Until Enter | The same brand, murals, fairy, mist and audio choices. The identity signature is now 12px. |
| Gateway on Enter | 3.2 seconds | The title fades out over its first 520ms. The outgoing opacity is captured if Enter interrupts the title dissolve. |
| Triforce arrival | 1 second | One warm light swell. The gateway camera continues across the entire 4.2-second entry/arrival; it no longer stops and switches to a second scale animation. |

Critical shot images notify readiness after decode, or after an error. The prologue camera can wait up to 1.2 seconds for actual image work; unavailable images cannot trap the visitor. A failed image keeps the drawn atmosphere/captions, and detached image callbacks do not update the parent. Decode readiness adds no fake portfolio-data loading state. The first shot fades in rather than popping into a moving frame.

## Motion and rendering changes

- The camera has less scale travel and gentler timing. The white/gold crest uses a less extreme zoom and a longer exit; there is no repeated strobing.
- The film adds two soft light volumes and at most 16 small motes, or eight on compact devices. They move using transform and opacity inside the isolated scene. Existing foreground fog and the continuously fluttering fairy remain.
- Wordmark letters use transform/opacity without one animated blur filter per letter.
- Main/text/image route entrances use less compounded opacity and no animated clipping. Welcome arrival no longer starts extra parent blur animations on top of the same child entrances.
- A new animation replaces an older one on the same element, preventing competing Web Animations. Scroll observation avoids simultaneously revealing an observed section and its nested cards.
- The fog reading gradient is cached between frames and rebuilt only when its bounds, quiet state or dimensions change. It is not allocated on every paint. Texture and canvas pixel budgets stay bounded.
- Fog has configured caps of 30 paints/second on desktop and 24 on compact devices, with remainder-preserving cadence. These are scheduling targets, not measured achieved frame rates. Browser-driven camera, fairy, light and route animations retain their own native cadence.

Full motion remains the owner's default. Manual motion-off support, ambient pause, music/effect preferences, hidden-tab pause, deep-link bypass, Skip/Escape and replay remain. Cleanup ignores a focus target inside the dialog itself, including Strict Mode re-entry, so it restores focus to the invoking page control or hero instead of a disappearing Skip button.

## Evidence and limits

- **117 Node tests pass**, including title-dissolve interruption, hidden-tab pause, stale callback rejection, image-independent completion and reading-mask cache invalidation.
- **137 TS/TSX/MJS files transform successfully.** This checks syntax, not semantic TypeScript.
- Actual-component execution with hook/DOM doubles passes **11 opening scenarios** and **three image-readiness cases**, including image failure, detachment and the bounded readiness fallback.
- Separate component checks exercise real route text/art nodes, compact motion, paper curves, rapid cancellation, hidden cleanup and **seven fog lifecycle scenarios**.
- Full TypeScript, ESLint and the Next production build remain blocked here because project dependencies are absent. Previous user build evidence is for the earlier version.
- No current browser is available. Desktop/mobile rendering, actual FPS, contrast, touch/keyboard behavior and listening still require local review. This update does not claim guaranteed 60fps or measured Core Web Vitals.

## Apply to the Windows Git clone

Stop the running dev server. Open the downloaded ZIP, then copy the **files inside its `zelda-portfolio` folder** into:

```text
C:\Users\Lorenz Salvador\source\repos\adonissimo-portfolio
```

The updated `package.json`, `app`, `components` and `lib` must be at that repository root. Keep `.git`, `.env.local` and your existing lockfile. Do not create a second nested application folder.

```powershell
cd "C:\Users\Lorenz Salvador\source\repos\adonissimo-portfolio"
npm.cmd pkg get version
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

The version must be **3.14.0**. Preview Home or use Replay welcome. Inspect the scene dissolve, gateway/crest handoff, silent entry, phone portrait/landscape and scrolling. Hide and restore the tab, and try Enter during the dissolve. Check that navigation, forms and the independent music controls still work.

After all four checks pass and the browser review is satisfactory, stage/review, commit and push using the established Git workflow. The ZIP does not update GitHub or Vercel on its own. A Vercel production deployment depends on the connected repository, branch and successful deployment build.

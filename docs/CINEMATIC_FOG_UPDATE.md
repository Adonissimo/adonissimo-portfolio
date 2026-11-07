# Visible cinematic fog and stronger rays — 3.12.0

The previous mist was a faint gradient behind content, further reduced by its reading mask. This update replaces it with a textured foreground atmosphere. Three cloud depths use uneven, shaded density and soft wispy edges; stronger light shafts pass over the cloud field. Wind stays slow, with small vertical drift rather than repeated bright pulses.

## Opening through every page

One shared WorldFog component lives in the root layout. It does not wait for Enter. The existing dialog-host store portals its canvas into the native welcome dialog, then returns it to the page on exit. It sits above scenery and content surfaces, below navigation, sound controls, book turns and the fairy. Inside the opening it stays below the Triforce flash. It cannot receive clicks or keyboard focus.

Warm daylight/forest-gold, cool moonlight, jade Depths/Zonai and riverside tones follow the existing theme and route. Private pages retain a quieter treatment. Measured copy/wordmark bounds reduce cloud and ray opacity across the reading region while keeping the scenery and margins fuller. The welcome protects both its title and supporting copy. Actual rendered contrast remains a browser check.

## Cloud material and budget

The material is an original procedural Canvas 2D effect, not a photograph or a full fluid simulation. Seamless domain-warped fractal noise creates broad banks, gaps, shaded density and feathered edges. Different sizes, offsets and wind speeds make foreground, middle and distant clouds move separately. There are no new external image/video requests or runtime dependencies; the existing theme artwork remains PNG.

Two small source textures are cached across the welcome/page handoff. Noise is not generated during animation. A bounded canvas composites cached layers, with maximum paint rates of 18 per second on desktop and 12 on compact/touch devices; buffers cap at 200,000 and 100,000 pixels respectively, regardless of display DPI. These are configured ceilings, not measured frame rates or battery claims.

An initial textured frame is drawn before the first animation tick. A visible static CSS fallback covers initialization or unavailable canvas support. Ambient effects pause freezes the texture rather than making the fog disappear. Hidden documents stop the frame loop; disposal cancels it and releases the drawing tile/listeners/observer. The calm 48-second ray movement remains. Existing music, sound effects, fairy, murals, entry flash and curved paper behavior are retained.

## Verification

- All 109 Node tests pass, including cloud density/soft edges, deterministic seams, phone/desktop buffer limits, immediate drawing, reading-mask presence, tile reuse, pause/disposal and missing-canvas fallback.
- All 135 TS/TSX/MJS files transform without syntax errors. This is not semantic TypeScript checking.
- Isolated evaluation of the actual WorldFog component checks Home before entry, the opening portal, public/private routes, hidden/paused states, canvas fallback and observer/listener disposal. Existing content/loading, menu/dock, opening/fairy/audio checks remain passing.
- An internal preview of the actual generated texture was inspected for visible cloud structure. It is not a browser screenshot and does not certify the composed site.
- Backend/API/database code, dependency declarations and PNG/audio bytes are preserved.

The authoring workspace lacks the installed TypeScript/ESLint/Next tooling and a usable browser. The check command reports Tests PASS, with the other three gates BLOCKED. Browser paint/contrast, actual mobile performance and sound playback still need local verification. No deployment or Phase 4 live-service acceptance was performed.

## Apply and see it

Stop the old dev server with Ctrl+C before extracting the complete ZIP. Replace source files in the project, preserving `.env.local` and `package-lock.json`. Avoid extracting into an extra nested project folder. Then run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

The banner must say `lorenz-zelda-portfolio@3.12.0`. The earlier supplied log said 3.9.0; if that still appears, the older folder/manifest is running. Reload http://localhost:3000 and use Replay welcome. Check that cloud banks and light shafts are visible in the opening, then visit all public routes and the desk, scroll, switch day/night, try a phone and return from a hidden tab. Confirm text, forms and controls remain usable. If Ambient effects is paused, resume it in the expanded dock to inspect motion.

This ZIP does not update Vercel automatically; use the existing publish workflow after local checks pass.

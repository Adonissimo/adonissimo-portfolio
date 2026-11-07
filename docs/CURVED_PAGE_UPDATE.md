# Curved paper turn — 3.11.0

The book leaf now bends while turning. Connected 3D strips share their edges; each rotation builds on the previous strip, so the free edge curls while the spine stays attached. Duplex paper faces, a fine page frame, the Triforce mark and a moving soft cast shadow give the turn more depth.

Desktop uses eight strips and a 940ms turn; compact/touch-first devices use five strips and 720ms. These timings are slightly slower than the prior 760/570ms. Both budgets describe a comparable peak curl near 60 degrees. Backward turns mirror the curve. The animation uses a fixed number of native WAAPI tracks with no JavaScript frame loop, image requests or new dependencies. Temporary transform hints exist only during active curved turns.

Route navigation still begins after its existing 130ms departure; it does not wait for the page animation. Rapid navigation cancels the previous paper, shadow and magic tracks. Hiding the document or unmounting also cancels them. If the browser lacks 3D transform styling, the original flat leaf remains the fallback. The opening's separate arrival does not start another paper curl over the 3.10 white/gold Triforce flash.

This full archive includes the animated opening fairy, calmer rays/mist, existing-PNG mural wings and audio behavior from [3.10.0](TRIFORCE_OPENING_UPDATE.md). They remain unchanged by the paper refinement.

## Verification

- All 105 Node tests pass, including bounded timing/strip profiles, a fixed spine, increasing outer-edge bend, comparable device curls, mirrored reverse movement and finite malformed-input handling.
- All 132 TS/TSX/MJS files transform without syntax errors. This is not semantic TypeScript checking.
- Isolated evaluation of the actual component checks eight/five rendered strip nodes, real curve keyframes, the moving cast-shadow track, forward/back reversal, rapid cancellation, hidden cleanup and an unchanged flat fallback. The same checks confirm that welcome arrival does not start the paper curl.
- Existing content, keyboard/menu/dock, opening fairy/entry/audio, real loading states and backend authorization source checks remain passing. Backend/API/database code, dependency declarations and PNG/audio bytes are preserved.

Full TypeScript/ESLint/Next build gates remain blocked by missing dependencies in this workspace. No real-browser render, GPU/frame-rate measurement, listening test, deployment or live backend acceptance was performed. The curl is a bounded segmented approximation rather than a cloth physics simulation.

## Apply and inspect

Extract the complete ZIP over the project, keeping `.env.local` and `package-lock.json`. Run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

Open http://localhost:3000. Follow Projects/About/Field notes and Back/Forward in both themes. The spine should stay attached while the outer edge curls and the shadow moves. Try rapid clicks, narrow portrait/landscape widths and a tab switch mid-turn: the current route should remain usable with no stuck paper overlay. Use Replay welcome to check the earlier opening changes. Verify on a real phone before publishing through the existing Vercel workflow.

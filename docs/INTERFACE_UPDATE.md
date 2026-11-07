# Compact interface update — 3.1.0

This update refines the existing Adonissimo project. It does not deploy the site or complete the outstanding Phase 4 acceptance checks.

## What changed

- The home page now shows a shorter hero, up to three project previews, a combined about/tools section and a compact contact strip. The full project list and biography remain on their existing routes. Project filters still expose built and planned work; planned entries do not acquire fake detail links.
- The existing forest/parchment palettes, Zelda wordmark, Triforce, original Master Sword landscape and local display font remain. System sans-serif body/control text, clearer navigation and consistent spacing make the ordinary website easier to use.
- Sign-in, signup, recovery and contact use split desktop layouts and stack on small screens. Labels, error messages, consent and verification remain visible. Authentication and contact request handlers are unchanged.
- Project indexes, articles and case studies have tighter headings and section spacing without truncating their prose. Forms and navigation retain at least 44px control heights.
- The journal desk uses smaller operational headings, denser tables and a single horizontal navigation row on smaller screens. Long messages expand individually with native keyboard-accessible disclosure controls. Activity has a bounded scroll region; permission and mutation handlers are unchanged.
- Music/effects controls start minimized. Expanding or collapsing them keeps the persistent audio element and its state mounted. The cinematic welcome, page turns, reduced-motion preference and randomized effects remain available.
- Footer links now identify Privacy and Journal desk correctly instead of describing the connected app as a demo.

## Apply the update

1. Back up your current project. Preserve your own `.env.local` and `package-lock.json`.
2. Extract the complete `zelda-portfolio` folder and merge these source changes into your project. This archive is based on the available 3.0.4 source; independently made local changes should be reviewed before replacing files.
3. Run the following in your project terminal:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

Open http://localhost:3000. No database migration, credential changes, setup wizard or account-role changes are needed for this UI release. Commit/push the reviewed changes if your Vercel project deploys from Git, or deploy using your established Vercel workflow. Downloading this archive alone does not update Vercel.

## Verification performed here

| Check | Result |
|---|---|
| Existing Node regression suite | 83 passed, 0 failed |
| Babel syntax/JSX parsing | 109 TS/TSX/MJS files parsed successfully |
| Isolated component checks with dependency/hook doubles | Preview limit and filters, planned-link behavior, seven page landmarks/unique IDs, collapsed message content/actions, Viewer navigation boundaries, minimized/expanded audio state passed |
| Semantic text token contrast | At least 4.5:1 across the three surfaces in each theme; this is not a whole-page accessibility audit |
| Dependency installation | Blocked by HTTP 403 for `@supabase/ssr` |
| TypeScript semantics, ESLint, Next production build | Not run: installed dependencies unavailable |
| Desktop/mobile visual, keyboard and hydration checks in a browser | Not run: no browser installed and browser download blocked by HTTP 403 |
| Real Supabase/OAuth/contact/email/Vercel checks | Not run in this environment |

The isolated checks are not React, browser, accessibility-conformance or live-service verification. No measured page-height reduction is claimed.

After local checks pass, review Home, Projects, About, Contact, Login and Journal desk at desktop and mobile widths, in both themes. Confirm the mobile menu and project filters, expand a message, and expand/minimize the audio dock while music is playing. Check visible keyboard focus, narrow-width table navigation and reduced motion. Existing Phase 4 live checkpoints remain separate.

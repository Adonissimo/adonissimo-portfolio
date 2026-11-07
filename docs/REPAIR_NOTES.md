# Version 3.0.4 — three-checkpoint acceptance runner

Added the protected no-store `/api/session` identity/role endpoint, `npm run checkpoint`, a native-Node HTTP/cookie test core and eight regression tests. The command verifies real account roles, tests Viewer deletion denial and fixture survival, edits/reloads the Owner draft and finds the matching attributable audit entry, then guides a real contact submission and checks its inbox/notification data. Actual email and visible badge observations are labeled separately. Only generated private draft fixtures are cleaned up; roles/preferences are not changed. Contact evidence is retained. Reports exclude credentials, cookies, emails and message bodies; partial or blocked results cannot return an overall pass. The existing integration suite now has eight real HTTP cases and verifies its account roles.

All 83 unit tests pass. A local HTTP/terminal fixture smoke exercised the complete command, masked input and redacted output; contact/email observations there were simulated. The full check reports TypeScript, ESLint and production build BLOCKED because dependencies are absent. This is verification tooling, not a completed live demonstration: administrator-disabled account access and absent real test sessions prevent running the three live checks from this chat. See [PHASE_4_CHECKPOINT.md](PHASE_4_CHECKPOINT.md) for execution and evidence.

## Version 3.0.3 — OAuth callback diagnostics

The user's deployed Google callback now reaches the production domain but returns to `/login?notice=callback`. This proves the redirect-host issue has changed; it does not identify a failed code exchange versus failed app-session establishment. The previous callback discarded every exception and misleadingly suggested that all failures were expired links.

Added a correlation reference and safe `auth_callback_failed` logging with the failed stage (`configuration`, `provider_response`, `code_exchange`, or `app_session`), allowlisted error code/type, and bounded HTTP status. OAuth codes, cookies, keys, email, raw exception messages, stacks and request URLs are never logged by this handler. A configuration failure is now caught; an invalid configured origin returns a no-store 503 rather than redirecting to an untrusted host. Session establishment remains required before reaching the dashboard.

Replace `app/auth/callback/route.ts` and `components/auth-form.tsx`, deploy them, then start a fresh sign-in on the production login page. In Vercel Logs, search for `auth_callback_failed` and the `ref` from the returned login URL. Send only that structured event. A `code_exchange` failure points to the PKCE/code-exchange step; an `app_session` failure points to verified claims or the service-only session RPC. Check `/health` for the public database probe; an `ok` result alone does not verify the private key, session RPC or successful login. The underlying live failure remains unconfirmed until this evidence is available.

Verification here: all 75 existing tests pass. Both edited authentication sources parse. An isolated execution of the actual callback handler with stubbed Next.js/Supabase adapters passed success, rejected/malformed provider response, verifier failure, session failure, configuration failure, safe redirect/correlation, and error-redaction scenarios. These checks do not verify real cookie transport, a live provider exchange, semantic TypeScript, ESLint or a production build for this patch.

## Version 3.0.2 — privacy-page ESLint repair

Escaped the three JSX apostrophes in `app/privacy/page.tsx` as `&apos;`, preserving the rendered wording and the ESLint rule. The user's v3.0.1 Windows run passed all 75 tests, TypeScript and the production build, then stopped setup because these three lint errors failed the verification gate. No database migration commands had started.

Verification here: all 75 existing tests pass again. The repaired page parses, contains no unescaped JSX-text characters, and its entity-decoded source matches the original page exactly. A full ESLint rerun remains necessary on the user's installed project; this workspace has neither installed ESLint nor the user's dependency lockfile.

Replace `app/privacy/page.tsx` from this archive, save, then rerun `npm.cmd run setup`. Keep the local `.env.local` and `package-lock.json`. The separate npm summary reports one high-severity vulnerability but does not name the affected dependency; the actual `npm.cmd audit` report is needed before choosing a dependency fix. No forced dependency upgrades are included.

## Version 3.0.1 — guided local setup

Added `npm run setup`: local masked prompts, safe environment merging, generated secrets, pre-migration checks, CLI login/link/migrations, Owner bootstrap with an in-memory password, and a database probe. It preserves unrelated configuration and removes an old bootstrap password assignment. No chat account access or credentials are required. All 75 Node tests pass, the new sources parse, and a local configure-only terminal smoke test passed without echoing keys or running provider commands. Provider and Windows handoff verification remain pending. See [PHASE_4.md](PHASE_4.md).

## Version 3.0.0 — Phase 4 integration

The full backend/UI integration, setup and limits are documented in [PHASE_4.md](PHASE_4.md). 71 Node tests pass; real service, database-policy, TypeScript/lint/build and browser verification remain outstanding. The existing Zelda experience and audio minimize control are preserved.

## Version 2.2.4 repairs

## Minimize the audio dock

- Added a minus button to minimize the music/effects panel into a 58px music-note control. Activating the same control restores the panel.
- Used a stable disclosure button with `aria-expanded`, `aria-controls`, an accessible label and title. The hidden panel's controls leave the Tab order; the disclosure retains focus and a 44px target.
- The native audio element and music/effects providers stay mounted. Minimizing changes visibility only, leaving playback, looping, volumes, mute and automatic interaction effects unchanged. The dock remains silent when toggled.
- The root-layout component keeps its minimized state through internal navigation. A fresh page load starts with the full panel. The dock's footer-clearance effect remeasures on every toggle, including without ResizeObserver.
- Added the minimize glyph to the existing SVG icon set and preserved both themes. No new dependencies or sound picker.
- Verification: all 63 existing Node tests pass, and both edited TSX files parse successfully. These checks do not replace a browser interaction review or a full TypeScript/lint/production build with installed dependencies.

Replace `components/background-music.tsx`, `components/icons.tsx` and `app/welcome.css` from this archive. Preserve `.env.local` and `package-lock.json`, restart the dev server and refresh. Check minimize/restore with mouse, touch and keyboard; confirm uninterrupted audio and footer access at narrow and desktop widths. Browser verification remains pending in this environment.

## Version 2.2.3 repairs

## Browser extension tolerance

- Added `suppressHydrationWarning` to the root body for external attribute injection such as Grammarly's `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed`. React's escape hatch suppresses mismatches on body itself, including any app-owned body attributes; it does not repair differing DOM or disable hydration validation in descendants. Keep the app-owned body attributes deterministic.
- Left Grammarly's functionality and injected attributes intact. Normal use should not depend on disabling common extensions. A clean browser profile is a diagnostic comparison.
- Inspected app/components/lib and dependencies: the portfolio contains no wallet provider SDK, connection request or `window.ethereum` access. The supplied MetaMask stack points to its chrome-extension inpage script. That trace alone does not establish that portfolio functionality failed, and this change does not repair an extension's own connection failures.
- No global console/error/rejection filtering was introduced. Actual application failures remain observable. No wallet provider is overwritten or stubbed.
- All 63 existing Node tests pass; the edited layout parses successfully. Real Grammarly/MetaMask coexistence, browser hydration and production behavior still need local verification because the authoring environment has no installed Next.js runtime or browser.

To apply this change over v2.2.2, replace `app/layout.tsx` from the archive, restart the server, and reload with extensions enabled. Preserve `.env.local` and `package-lock.json`. Run `npm.cmd run check`, then `npm.cmd start` after a successful build to check the production server. Exercise public navigation, welcome entry/replay, music, contact and the demo dashboard with the extensions enabled. Record any failed action separately from extension-origin console output.

## Version 2.2.2 repairs

## Welcome focus / hydration repair

- Declared `tabIndex={-1}` on the home hero heading in its server-rendered JSX. The welcome can focus the heading without changing its attributes before hydration, including when React development Strict Mode rehearses effect cleanup.
- Removed the welcome cleanup's imperative heading tabIndex assignment. Focus still returns to the connected opener or the hero heading, without scrolling. The heading remains outside the sequential Tab order.
- The cinematic opening, book transitions and audio behavior are preserved. No hydration-warning suppression was added.
- The 63 existing Node tests pass and both edited TSX files parse successfully. Full Next.js/browser verification remains unavailable in this authoring environment; confirm a hard refresh, Enter, Skip, Escape and Replay locally.

For this repair, replace `app/page.tsx` and `components/cinematic-intro.tsx` from the updated archive. Preserve `.env.local` and `package-lock.json`, restart the development server, and reload the page. No dependency changes are required.

## Version 2.2.1 repairs

## Open Graph production-build repair

- Fixed `/opengraph-image` prerendering. Every image-layout div explicitly uses `display: flex`, and the author line is one interpolated string instead of adjacent JSX child nodes. The existing Zelda artwork, colors and wording are preserved.
- Set root `metadataBase` unconditionally. It resolves from `NEXT_PUBLIC_SITE_URL`, then Vercel's deployment/production host, then localhost for local builds. Canonical and sitemap origins still require an explicitly configured public URL.
- The user's local v2.2.0 check passed tests, TypeScript and ESLint, then failed during Open Graph prerendering. That output confirms the first three gates for the previous source; a fresh production build of this repair still needs to run locally.
- Verification of v2.2.1 here: all 63 tests pass; local/preview/production/configured/invalid metadata-origin scenarios pass; the three changed TypeScript/TSX sources parse and all five Open Graph divs have explicit flex layout. Full TypeScript, ESLint and Next build remain blocked here by unavailable dependencies.

For this repair, replace `app/opengraph-image.tsx`, `app/layout.tsx` and `lib/site.ts` from the updated archive, then run `npm.cmd run check`. No dependency changes are required. Preserve `.env.local` and your generated `package-lock.json`.

## Version 2.2.0 repairs

## Changes

- Kept the reported fixes: demo role cookies use Server Actions; client navigation uses Next.js useRouter; PostCSS uses a named export.
- Replaced effect-driven React state hydration with a shared external store. No react-hooks/set-state-in-effect suppression is needed. Sequential edits read the latest snapshot, and all mounted consumers see updates.
- Distinguished corrupt saved data (reset required) from storage read/write failures (usable in-memory demo). A failed write does not close the editor or claim that a contact message was stored.
- Reset reports whether browser storage was actually cleared. Valid persisted changes can be read by a fresh store.
- Validated stored entry fields, optional URLs, unique IDs/slugs, message/user fields, settings and bounded list sizes. New-entry limits permit editing existing records. Invalid state can be reset without crashing the editor.
- Replaced the Markdown control-character regex with character validation, retaining unsafe-link rejection without relying on a control-character regex.
- Fixed the optional Turnstile widget lifecycle for Strict Mode and route unmounts. The script-ready event drives rendering; vendor callbacks are ignored after cleanup, and widget cleanup failures are contained.
- Isolated local image preview state, aborting obsolete readers on replacement/unmount and handling invalid/read/decode failures.
- Added a demo-record ID fallback for environments without crypto.randomUUID. Demo IDs are not security tokens.
- Updated `npm run check` to execute and report tests, TypeScript, ESLint and production build independently. Warnings remain disallowed by ESLint. The command returns nonzero for any failed or blocked stage.

## Verified here

- 63 Node tests passed, including storage denial/quota/corruption recovery, consecutive state updates, role-preview constraints, safe links, bounded lists and ID fallback.
- 69 TypeScript/TSX/MJS files parsed successfully; 135 local import references resolved.
- PostCSS configuration imported successfully with its expected Tailwind plugin.
- Source scan found no client document.cookie writes, location.assign navigation, empty catch blocks or lint-disable comments in the app/components/lib/config files.

These are source and simulated-behavior checks, not a completed TypeScript/lint/build/browser run.

## Blocked verification

A fresh npm install returned HTTP 403 from the npm registry. No cached compiler, ESLint, React or Next installation was available here. Running the complete check command correctly reported:

| Stage | Actual result |
|---|---|
| Tests | PASS — 63 |
| TypeScript semantic checks | BLOCKED — dependencies absent |
| ESLint | BLOCKED — dependencies absent |
| Next production build | BLOCKED — dependencies absent |
| Browser verification | Not run |

No assertion that every possible build/runtime error is fixed can be made until those stages run with installed dependencies.

## Apply on Windows

Extract the updated project over the existing source files. Include the new lib/demo-store.ts, components/project-image-preview.tsx and scripts/check.mjs, as well as the earlier app/demo-session-actions.ts. Preserve your own .env.local file.

In the zelda-portfolio folder, run:

```powershell
npm.cmd install
npm.cmd run check
```

If every stage passes, run npm.cmd run dev and check the public pages, demo entry/sign-out, contact form, editor save/reset and image preview in the actual browser. Share the complete check output if a stage still fails; the output now includes every stage rather than only the first failure.

The project remains a Phase 3 demo. These repairs do not add real authentication, database storage, server RBAC, production mail delivery or a deployment.

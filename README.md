# Adonissimo — Lorenz's Zelda portfolio

Version **3.13.0** adds two cutscenes: a 4.8-second field-to-sky prologue before the title, and a 2.6-second gateway journey after Enter, followed by the existing 820ms white/gold Triforce arrival. The title waits for Enter. Both films can be skipped, pause in hidden tabs, use the existing PNG art, and retain the fairy/fog and separate music/effects controls. See [the cutscene update](docs/OPENING_CUTSCENES_UPDATE.md). Stop the dev server before extracting; the restarted terminal should print **3.13.0**.

Version **3.12.0** replaces the faint background mist with textured foreground cloud banks and stronger light shafts. A shared canvas atmosphere moves into the welcome dialog and continues across every page, using calm layered drift, protected reading areas and a smaller phone rendering budget. See [the cinematic fog update](docs/CINEMATIC_FOG_UPDATE.md). Stop the dev server before extracting; the restarted terminal should print 3.12.0.

Version **3.11.1** fixes the reported Next development warnings: the visible page backdrop loads eagerly, Home's hero image uses eager/high-priority loading, and the HTML root declares smooth scrolling for router coordination. Stop the dev server before extracting updates, then restart; the terminal should print 3.11.1. See [the warning fix and Windows steps](docs/DEV_WARNINGS_UPDATE.md).

Version **3.11.0** gives page turns a curved 3D paper surface and a moving fold shadow. Turns are slightly slower at 940ms desktop / 720ms compact, with a smaller phone effect budget and the same prompt navigation. It includes the calm mist/rays, animated welcome fairy, PNG mural wings and Triforce entry from 3.10.0. See [the curved-page update](docs/CURVED_PAGE_UPDATE.md).

Version **3.10.0** fixes the fairy wings inside the opening dialog, adds fuller drifting mist throughout the site and existing-PNG mural panels around the welcome, and turns Enter into a white/gold Triforce zoom over 820ms. The same cursor pool moves into the dialog through a portal, keeping its idle/speed animation. See [the opening update](docs/TRIFORCE_OPENING_UPDATE.md) for the changes and verification limits.

Version **3.9.0** adapts navigation, project layouts, forms and the audio dock for phones. The fairy wings keep a slow idle flutter and accelerate with cursor speed. Day/night and realm-specific moving rays, mist and a slightly fuller leaf field accompany the expanded Triforce opening. An original forest prelude attempts to start on the welcome screen without a sound button; browsers may require a real interaction. Enter hands off to Zelda's Lullaby. See [the mobile and cinematic update](docs/MOBILE_CINEMATIC_UPDATE.md) for installation, playback behavior and verification limits.

Version **3.8.0** repairs the full-motion gate, connects Enter to the magical reveal, expands scroll reveals to streamed content, restores the original wide PNG footer and adds drifting leaves/motes, a breathing background and a winged fairy cursor/light trail. The expanded dock can pause ambient effects while page transitions/music remain independent. See [the motion repair and living-world update](docs/LIVING_WORLD_UPDATE.md), including exact verification limits and Windows steps.

Version **3.7.0** uses transparent foreground scenery across the shared pages and a complete cutout in the footer. Route navigation choreographs actual text, images and the background with the book leaf, a carved rune, twelve bounded sparks and matching magical paper/bell sounds. Full motion is the default and the visible motion toggle is removed. Two scenery edits were generated; sky/Depths reuse existing transparent art after the image tool reached its limit. See [the artwork, animation and sound update](docs/ENCHANTED_PAGES_UPDATE.md).

Version **3.6.1** adds a version-scoped minimatch patch for the TypeScript lint dependency identified in the supplied lockfile, pins that parser cohort, and checks real matcher/project resolution before linting. The user's **3.5.0** report passed all four check gates; the new dependency patch still needs an installed-tree audit and complete local check. The ESLint 9 support warning remains pending compatible plugin updates. See [the lint dependency patch and exact Windows instructions](docs/LINT_DEPENDENCY_UPDATE.md).

Version **3.6.0** gives Home, Projects, About, Contact and Field notes five distinct background images matched to their setting. Project/article details inherit the matching environment; auth and the private desk use a quieter Zonai backdrop. All bundled theme illustrations and backgrounds now use PNG source files. See [the environment backgrounds update](docs/REALM_BACKGROUNDS_UPDATE.md).

Version **3.5.0** added an illustrated Hyrule atlas behind the public pages, a restrained version behind auth, and locally supplied serif/sans typography with real italic and bold files. Text has a protected reading wash, a continuous headline scale, readable labels and long-title wrapping. See [the background and typography update](docs/ATLAS_UPDATE.md).

Version **3.4.0** added transparent Zelda-inspired relic and botanical PNGs around the existing scenery, a bounded carved-seal welcome effect, and project hover framing. Home streams its live project section independently; collection refreshes keep previous results visible, with static skeletons for genuinely missing data. See [the relic and loading update](docs/RELICS_UPDATE.md).

Version **3.3.1** pinned Sharp to **0.35.5** and updated the upload route to import its `OutputInfo` type directly. That fix remains in this release. See [the dependency update](docs/DEPENDENCY_UPDATE.md) for the outstanding minimatch audit findings and local verification steps.

Version **3.3.0** expanded the graphics throughout the portfolio: matching sky-island, Zonai-workshop, Hyrule-field and Depths artwork; illustrated page headings and footers; scenic project artwork; and geometric inventory/separator details. Lorenz’s name/full-stack focus, readable text, compact layouts, real backend, skeleton loading and cinematic/audio behavior remain. See [the graphics update](docs/GRAPHICS_UPDATE.md), [the branding guide](docs/BRANDING.md) and [the earlier brand implementation](docs/BRAND_IMPLEMENTATION.md).

Start with [the complete Phase 4 setup guide](docs/PHASE_4.md). It covers Windows/Visual Studio, Supabase migration and Owner bootstrap, Auth/OAuth/email configuration, Turnstile, Resend retries, real authorization tests and Vercel Preview deployment.

## Guided local Supabase setup

With the complete archive extracted and Node.js 24 available, save and close any open `.env.local` editor tab, then run:

```powershell
npm.cmd run setup
```

The wizard collects your Supabase URL/keys and Owner email locally, generates missing app secrets, preserves unrelated `.env.local` settings, installs dependencies, checks the project, opens CLI login, links the selected project, applies migrations and bootstraps Owner. Keys and passwords are hidden while entered. The Owner password is passed only to the local seed process and is not written by the wizard. Existing bootstrap-password assignments are removed from `.env.local`.

Complete the Supabase browser login and enter the database password in your own terminal when requested. The wizard reports a database probe; it does not claim that all auth/email/browser tests passed. OAuth, SMTP, contact/email services, scheduling and Vercel environment configuration remain separate steps in the Phase 4 guide. The wizard stops on failed checks; it does not silently skip them.

Use `npm.cmd run setup -- --configure-only` to write local configuration without installing packages or changing the database. Windows-specific CLI handoff and live provider operations have not been tested here.

## Run on Windows

For the three Phase 4 demonstrations, deploy the new protected session endpoint and run:

```powershell
npm.cmd run checkpoint -- --url https://zelda-portfolio-tawny.vercel.app
```

It uses real Owner/Viewer email/password sessions, verifies Viewer deletion denial and an attributable edit audit, then guides one real contact submission and records your email/badge observations. Credentials stay local; the redacted report is saved under `checkpoint-reports/`. See [the checkpoint guide](docs/PHASE_4_CHECKPOINT.md) for accounts, prerequisites and the distinction between API proof and observed delivery. This command has not completed the live checks from the authoring chat.

Use Node.js 24. In Visual Studio 2022, open View → Terminal inside this folder. Preserve your existing `.env.local` and `package-lock.json` when extracting updates. Merge new variables from `.env.example`, then run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

Open http://localhost:3000. In PowerShell, `.cmd` avoids the npm.ps1 execution-policy issue. On macOS/Linux, use `npm` instead. After a successful production build, use `npm.cmd run start` to test the actual production server.

No newly resolved lockfile is bundled because npm access was denied here with HTTP 403. Preserve your existing lockfile and run `npm install` after merging this update so it matches the changed manifest. Commit both files and use `npm ci` for repeatable installs thereafter.

Without backend configuration, the public site shows the existing source-managed portfolio and clearly labeled sample blog articles. Sign-in and contact do not create fake accounts/messages. Once configured, public projects/posts come from the database; backend failure is reported rather than silently replacing published work with fixtures.

## Stack and architecture

- Next.js 16.4.3 App Router, React 19.3.0, TypeScript and Tailwind CSS 4.3.3.
- Supabase Auth, Postgres RLS, private Storage and cookie-based SSR integration.
- Next.js Route Handlers for validation, origin protection, shared rate limits, CMS operations and jobs.
- Sharp validates actual image bytes and creates bounded WebP derivatives.
- Resend transactional email with a durable database outbox and authenticated retry worker.
- Cloudflare Turnstile verification on the server.
- Vercel configuration and preview instructions; no deployment was performed by the authoring environment.

Privileged keys remain in server-only modules. Public pages use anonymous database clients; private operations use verified claims, current roles and eligible application sessions. CMS writes also pass RLS. Public role-selection cookies from Phase 3 are ignored. A new signup is always Viewer.

The server-mediated session model uses HTTP-only cookies. Owner badges poll every 15 seconds while visible and do not extend idle sessions. Public database pages use fresh SSR reads for publication correctness; earlier ISR/Realtime plans remain future measured optimizations. See [architecture](docs/ARCHITECTURE.md) for the implementation delta and original design.

## The Zelda experience

The site is Lorenz Anthony Salvador's unofficial Legend of Zelda fan portfolio, branded **THE LEGEND OF ADONISSIMO**. The existing original Master Sword/Triforce/Hylian/Sheikah art, forest and parchment themes, self-hosted serif font and keyboard/reduced-motion controls are retained.

A fresh home load shows a welcome that waits for Enter. Enter starts the supplied **Zelda's Lullaby** recording; Enter silently pauses music and disables effects. Skip/Escape enter without starting new audio. The footer can replay the opening.

One persistent root audio element loops through internal navigation, scrolling, tab switches and minimizing the browser. User pause/mute stays authoritative. Browser/device suspension can still interrupt playback independently of the site. Media Session controls are used where supported.

The dock provides music play/pause/mute/volume, independent sound-effects on/off/volume and an Ambient effects pause for background/cursor decoration. It starts as a small music-note button; activate it to reveal the controls, then use the minus button to collapse them again. Minimizing the panel keeps playback active and remains in effect during internal navigation.

Eighteen original procedural effects are randomly applied to explicit interactions. Each set is used before refilling, with no adjacent repeat. Typing, hovering, scrolling and audio controls remain silent. There is no sound picker. Storybook cover/page transitions follow this edition’s explicit full-motion choice. Ambient effects can be paused independently. See [the effects guide](docs/STORYBOOK_EFFECTS.md).

The user-supplied MP3 is bundled unchanged at `public/audio/zeldas-lullaby.mp3`. Keep the attribution and verify your rights before a public release. Nintendo owns the referenced Zelda names and characters; the portfolio is unofficial and unaffiliated.

## Data and verification

The real dashboard supports project/post draft/publish CRUD, tags, image upload, private inbox state, notifications, roles/account state, preferences and audit entries. Public pages expose published content only. Message receipt, notifications and email jobs are transactional; delivery failures preserve the message.

The current source suite has **95 passing tests**, including ambient state/particle limits and full-motion bootstrap regressions alongside the existing audio, authorization, content, setup and checkpoint coverage. These are not evidence that real authorization or email delivery passed. The eight real HTTP tests and 12 pgTAP assertions are supplied separately and require configured services.

```powershell
npm.cmd run test:integration
```

`npm run check` reports every local gate independently. Here, dependency installation returned HTTP 403 for `@supabase/ssr`; TypeScript semantics, ESLint, Next build and browser checks could not run. No Supabase migration or live acceptance test was executed. See [status](docs/STATUS.md).

## Project documents

- [Interview-defined branding](docs/BRANDING.md)
- [Brand implementation and verification](docs/BRAND_IMPLEMENTATION.md)
- [Compact interface update and verification limits](docs/INTERFACE_UPDATE.md)
- [Phase 4 setup, endpoints and acceptance](docs/PHASE_4.md)
- [Run the three live checkpoint demonstrations](docs/PHASE_4_CHECKPOINT.md)
- [Requirements and permission matrix](docs/REQUIREMENTS.md)
- [Architecture and implementation decisions](docs/ARCHITECTURE.md)
- [Actual status and missing release evidence](docs/STATUS.md)
- [Original supplied activity](docs/ACTIVITY_GUIDELINES.md)
- [Earlier Phase 3 preview](docs/PHASE_3.md)
- [Repair history](docs/REPAIR_NOTES.md)

## Deploy a preview

Complete the migration/service setup and a successful local check. Configure the corresponding Preview environment variables in Vercel. Keep bootstrap and integration-test passwords local. Deploy from this directory:

```powershell
npx.cmd vercel@latest deploy --target=preview
```

For Git deployments, the root directory is the folder containing `package.json`, the preset is Next.js, the Node version is 24.x and the build command is `npm run build`. Database migrations are a separate step. `vercel.json` does not create accounts, keys, a database or a live deployment.

Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin before release. No fake domain is prefilled; canonicals/sitemap need the explicit origin. Social-image metadata has a configured/Vercel/local fallback. Browser-extension body attributes are tolerated with a scoped hydration-warning escape hatch; actual component errors remain visible.

## Personal content

`lib/content.ts` still holds your public biography/toolkit and the initial seed source. Update it with real facts and links. After Supabase is configured, maintain projects and posts in the real dashboard. Editing a source fallback project will not replace a live CMS entry. Do not use an older Phase 3 archive to replace this backend-enabled project.

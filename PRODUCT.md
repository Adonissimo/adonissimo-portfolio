# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Three.js enhancement

Home's illustration and opening films include original procedural Three.js sky islands and a gateway. Detailed terrain uses photographed CC0 Poly Haven rock/forest-floor color, normal and roughness/occlusion maps, dense eroded cliff/ground meshes and individually instanced leaves instead of rounded canopy blobs. Texture provenance is in public/textures/terrain/README.md. Page turns use a continuous paper mesh, with existing DOM/CSS fallback. No imported Nintendo models are added. Existing welcome/Skip behavior, captions, audio ownership, backend authorization and real content remain. WebGL is optional and client-loaded; production build and source tests are distinct from the currently blocked browser verification and unverified live deployment.

## Stack

The user asked for modern React/Vercel tooling. This implementation uses Next.js App Router, React, TypeScript, Tailwind CSS, and ESLint. The user has deployed it to Vercel and reports that Google sign-in works. Version 3.0.0 introduced the Track A Supabase Auth/Postgres/RLS/Storage integration, Resend outbox and Cloudflare Turnstile verification in source. The current source is 3.14.2, with compact layouts, interview-defined TotK branding, realm scenery and transparent PNG ornaments, five setting-specific PNG page backdrops, local serif/sans typography, selective skeleton loading and a browser-assisted three-checkpoint runner. Navigation moves actual text and artwork with a book leaf, rune/spark reveal and semantic paper/bell sounds. Foreground scenery is transparent, full motion is the default and the visible motion toggle is retired. It also configures a scoped TypeScript lint dependency patch whose installed-tree verification remains open. The user's new-computer report passes all four ordinary gates for 3.5.0, not the later source. Phase 4 live acceptance remains open for the other required flows; deployment alone does not complete Phase 5.

## Product Purpose

Lorenz Anthony Salvador's personal portfolio and full-stack content management system, following docs/ACTIVITY_GUIDELINES.md. The target includes public Home/About/Projects/Blog/Contact pages and a private Owner/Editor/Viewer dashboard. Visitors browse published work and submit messages; authorized users manage content without editing source code.

## Brand Commitments

The user explicitly requires The Legend of Zelda itself as the theme and has selected **Adonissimo** as the portfolio wordmark/brand. The visible title is "THE LEGEND OF ADONISSIMO"; the owner remains Lorenz Anthony Salvador. The user requested a cinematic welcome before entry, animated clickable controls, background music, and a storytelling/fantasy-book feeling through button sounds and page turns. The welcome waits for Enter. The user supplied a recording and corrected its title to **Zelda's Lullaby**; the included music begins only from Enter/Play, then continues while off screen or in another tab as explicitly requested. Visibility never overrides manual pause/mute. Eighteen original procedural paper/harp/bell/rupee/rune effects accompany explicit interactions, with independent mute/volume and automatic randomized playback across site interactions. Use recognizable Triforce, Master Sword, Hylian shield, Sheikah motifs, and Hyrule terminology. Preserve readable portfolio navigation and Lorenz's identity. Clearly identify the site as an unofficial fan portfolio.

### Interview-confirmed identity

Adonissimo is Lorenz’s personal nickname. The portfolio targets internship and full-stack web developer opportunities. Lead with Adonissimo and show Lorenz Salvador’s name and full-stack focus immediately. Express reliable/useful software, curiosity, visual care and thoughtful problem-solving through actual work and honest explanations. Use a playful, adventurous voice with light Zelda references; keep navigation and operational feedback plain.

Tears of the Kingdom is the principal world. Settings follow context: sky islands on Home, Zonai workshop on Projects, Hyrule fields on About/Contact, the Depths on Field notes, and quiet Zonai styling on auth/admin. Share typography, controls, navigation and day/night preference across them. Lorenz delegated the visual direction after the interview and supplied no external site reference. See docs/BRANDING.md for the durable rules.

## Evidence on Hand

The portfolio implementation is the only real project supplied. Future projects are reserved slots, not fabricated case studies. No email, GitHub username, LinkedIn URL, resume, employment history, or project metrics have been supplied. The user-supplied MP3 `28. Zelda's Theme.mp3` is bundled as `public/audio/zeldas-lullaby.mp3`, labeled Zelda's Lullaby according to the user's correction.

## Capabilities and Constraints

Current source includes the Phase 4 server-connected dashboard, real authentication, server RBAC/RLS, persisted draft/published content, contact inbox/outbox, notifications, media, audits and health routes. Public demo role selection is retired; older preview helpers remain historical implementation material. Day/night, keyboard/reduced motion, music and effects remain. Vercel deployment and Google sign-in are user-confirmed; other live backend acceptance, CI, monitoring, backups and a custom domain remain unconfirmed or open as tracked in docs/STATUS.md. The activity requires review checkpoints before advancing phases.

## Product Principles

- Project content must stay truthful.
- Zelda artwork supports browsing without requiring a game tutorial.
- Common navigation works with keyboard and touch.
- Current local content is a scaffold; production content must be managed through the CMS with server authorization.
- Keep target requirements, actual implementation, and measured release evidence distinct.

## Repair behavior

Version 2.2.0 uses a shared useSyncExternalStore-backed demo store. Valid tab-local edits are shared across mounted consumers; storage failures leave the editor usable and do not report persisted success. Corrupt saved data has an explicit reset path. Image readers are aborted on replacement/unmount. The optional verification widget tolerates Strict Mode setup/cleanup. Full production validation remains a local gate because dependency installation is blocked here.

### Mobile and cinematic opening — 3.9.0

The current update follows the owner’s requests for phone optimization, continuously fluttering speed-responsive fairy wings, moving page-specific rays/mist/leaves and an expanded Triforce opening. Compact navigation starts at 960px and includes Contact; forms/projects/dock compose for phones with a smaller effect budget and full visible motion. The original forest prelude attempts audible autoplay before entry without a forest sound button; browsers may require a trusted gesture. Entry stops it before Zelda’s Lullaby. See docs/MOBILE_CINEMATIC_UPDATE.md for exact behavior and remaining verification.

### Opening refinement — 3.10.0

The user asks for animated fairy wings before entry, fuller mist across the opening and all pages, opening murals, a white/yellow zooming Triforce flash on Enter, and calm ray/mist movement. The single fairy now portals into the native welcome dialog; it retains its idle and speed response and returns on cleanup. Existing PNGs form stone/forest mural wings. Four desktop/three compact fog banks move on 52–84-second legs; rays move on 48-second legs with restrained brightness changes. The Triforce entry lasts 820ms and remains skippable. Image generation was usage-limited, so no new mural illustration is claimed. See docs/TRIFORCE_OPENING_UPDATE.md for source evidence and browser/build limits.

### Curved page turn — 3.11.0

The user asks for a slightly slower page turn with a visible paper curve. The book leaf now uses a connected 3D strip chain, anchored at the spine, with mirrored forward/backward bends and a soft moving shadow. Desktop turns take 940ms using eight strips; compact turns take 720ms using five. The route still starts after the existing 130ms departure, without waiting for the decorative turn. Unsupported 3D styling retains the flat leaf, and welcome arrival does not start a second paper turn. Calm atmospheric timing and the 3.10 opening stay. See docs/CURVED_PAGE_UPDATE.md.

### Development warning repair — 3.11.1

The visible selected backdrop loads eagerly, Home’s hero uses eager/high-priority loading, and the HTML root declares smooth scrolling for Next router coordination. This addresses the two supplied warnings without suppressing diagnostics. The user’s log reports 3.9.0; the complete update includes the later cinematic/mobile work. See docs/DEV_WARNINGS_UPDATE.md for applying updates with the server stopped and the remaining local gates.

### Visible cinematic atmosphere — 3.12.0

The user cannot see the gradient mist and asks for visible, more realistic/cinematic fog and stronger rays. A shared foreground canvas now composites three slowly moving textured cloud depths, including in the native welcome dialog via a portal. The texture uses deterministic domain-warped noise and is cached per device budget. Stronger day/night/realm lighting, protected reading columns, pointer transparency, pause/hidden cleanup and a static fallback preserve usability. See docs/CINEMATIC_FOG_UPDATE.md for the actual evidence and local browser/build gates.

### Before-title and after-Enter cutscenes — 3.13.0

The user asks for a cutscene before The Legend of Adonissimo and another after Enter. The native welcome now begins with a 4.8-second two-shot field/sky prologue using existing PNG art, moving camera crops, mist/light, a geometric crest and short captions. It then mounts the existing title and waits. Enter starts music synchronously from the gesture, stops the forest prelude, and starts a 2.6-second gateway scene before the 820ms Triforce arrival. Skip/Escape is available in each phase; hidden tabs pause both film clock and CSS, repeated Enter cannot restart the film, and deep links still bypass the automatic opening. No new dependency, video download or generated image is introduced. See docs/OPENING_CUTSCENES_UPDATE.md for exact behavior and verification limits.

### Smooth cinema and aura — 3.14.0

The user requests smoother animation and more cinematic aura. The existing film now has bounded image readiness, a 5.6-second prologue, an 800ms title dissolve and a 3.2-second gateway journey plus one-second Triforce arrival. Layered warm light, bounded gold/jade motes, gentler camera travel and coordinated route/scroll entrances preserve the TotK identity. Fog caches its reading gradient and targets a steadier bounded paint cadence. The 3.13.1 cleanup fix and full-motion default remain; no new dependency or raster asset is added. All 117 Node tests and 137 syntax transforms pass here; current TypeScript/lint/build/browser/FPS/listening remain unverified. The user supplied a successful earlier GitHub push to main, not a deployment of this update. See docs/SMOOTH_CINEMA_UPDATE.md.

### Text and atmosphere — 3.14.1

The owner asks for text shadows or golden light so PNG scenery and strong mist/rays can remain visible. Public copy now uses theme-aware edge shadows, headings add a restrained gold halo, public washes are lighter and welcome murals are clearer. Page fog draws below content; opening fog retains its dialog layer. Private/auth backdrops stay quiet. Existing full motion, audio and navigation are unchanged. See docs/TEXT_LIGHT_UPDATE.md for verification limits.

### Open scenery without green reading panels — 3.14.2

The owner rejects the remaining broad green rectangles in current screenshots and permits localized green areas near PNG scenery. Remove page/mural reading washes, layout-bound fog/ray masks, the title cover/bands and film shade. Use continuous atmosphere behind lettering, glyph shadows for reading and soft green shadows following actual PNG alpha contours. Quiet private pages retain low art/effect opacity and functional controls. Include Git commit/push instructions in every portfolio file handoff. See docs/OPEN_SCENERY_UPDATE.md.

# Adonissimo — a builder exploring Hyrule

## Contents

1. Brand idea
2. Setting by context
3. Shared visual grammar
4. Color roles
5. Copy and interaction examples
6. Acceptance criteria

## Brand idea

**A builder exploring Hyrule.** Adonissimo is Lorenz’s own nickname; the work belongs to Lorenz Anthony Salvador. Exploration describes curiosity and learning. Working software, readable case studies, and honest states supply the engineering proof.

Use this portfolio for internship and full-stack web developer opportunities. Show the brand first, then Lorenz’s name and full-stack focus in the same initial content area. Let “View projects” be the primary action and “Contact” an ordinary, reachable route. Offer a résumé only when a real file is supplied.

## Setting by context

| Surface | Setting | Expression | Visitor task |
|---|---|---|---|
| Home / welcome | Sky islands | Pale stone forms, open sky, gold, a recognizable floating-island composition | Identify Lorenz and reach real work |
| Projects / project case studies | Zonai workshop | Carved-stone geometry, jade accents, restrained mechanisms | Understand what was built and how |
| About | Hyrule fields and forest | Golden tree, field plants, warm stone and human first-person copy | Meet Lorenz |
| Contact | Hyrule riverside | Water, a stone bridge, willow branches and Silent Princess flowers within the fields palette | Start a conversation |
| Field notes / technical articles | The Depths | Dark mineral surfaces at night, readable cool stone by day, small lightroot accents | Read and investigate |
| Auth / private dashboard | Quiet Zonai desk | Shared jade/gold controls and compact tables, minimal scenery | Sign in and manage real content |
| Privacy / errors / unknown routes | Shared neutral system | Clear typography and ordinary controls | Understand the situation and continue |

Keep setting changes subordinate to consistent wayfinding. Do not assign a random setting on every visit or auto-change the user’s day/night preference. Make detailed articles comfortable to read; the Depths never means low-contrast text.

Each main public page uses its own PNG backdrop image. About and Contact share the fields palette while using different artwork. Project and article detail routes inherit their parent setting. Auth and admin use the Zonai art at quiet opacity. Theme illustrations and backgrounds use PNG source files; accessible interface geometry remains code-native and real CMS media retains its supplied/processed format.

## Shared visual grammar

- Use locally supplied Latin Modern Roman regular/italic for editorial and display text, and Latin Modern Sans regular/bold for body text, labels, tables and controls. This 3.5.0 font refinement follows Lorenz's explicit request to improve the typography; it keeps the established serif/sans roles. Keep the local font notices with the source.
- Keep one primary action per main content group. Keep important navigation labels familiar.
- Use a maximum content shell near 1160px; use 20–40px outer gutters and readable prose near 65–72 characters per line. Let narrow layouts compose vertically.
- Use approximately 36–64px public display type, 26–36px section headings, 15–16px body text, and 13–14px control labels. Retain at least 44px control targets. Use smaller metadata sparingly.
- Prefer 24–48px section spacing to repeated full-screen sections. Bound home project previews at three. Move long biography and detailed case-study prose to their own routes.
- Use restrained 5–8px corners on controls/containers. Use round controls for established theme/audio buttons. Use tonal surfaces and purposeful separation; avoid wrapping every paragraph in a card.
- Keep Triforce, Master Sword, Hylian shield, and Zonai-inspired geometry recognizable. Treat invented glyphs as decorative, never real translations or navigation labels.
- Preserve the original forest/parchment heritage through all four settings. Use sky/stone/jade differences to establish place rather than turning each page into a different product.

## Color roles

Implement colors through semantic CSS variables: background, surface, raised surface, text, secondary text, gold, jade/focus, primary action, and primary-action ink. Measure normal text at a minimum 4.5:1 contrast against its actual surface. Keep interactive focus visible in every setting and theme.

Suggested setting grounds and accents, subject to measured contrast:

| Setting | Night ground | Day ground | Night gold | Day gold | Night jade | Day jade |
|---|---|---|---|---|---|---|
| Sky | `#11292a` | `#f5f2e8` | `#dec58a` | `#705421` | `#a4dac7` | `#236b59` |
| Zonai | `#101f1c` | `#ebeee4` | `#dcc08a` | `#705421` | `#91d7b2` | `#28664b` |
| Fields | `#17251b` | `#f3efdf` | `#dfc486` | `#705421` | `#add2ad` | `#2f6751` |
| Depths | `#121c22` | `#e8eeeb` | `#dbc48c` | `#705421` | `#9cdac8` | `#256653` |

Use jade as a precise accent and gold for brand/emphasis. Do not add neon UI glow, gradient text, glass panels, fake grain overlays, rainbow status colors, or unrelated purple/blue technology branding. Scene artwork may use natural shading without turning the interface into a glow effect.

## Copy and interaction examples

Prefer:

- Identity: “I’m Lorenz Salvador. I build full-stack web projects with curiosity and care.”
- Projects introduction: “A few things I’ve built, and what I learned along the way.”
- Contact: “Have a project in mind? Send a letter.”
- Planned entry: “An idea taking shape.”
- Error: “Your message could not be sent. Please try again.”

Avoid:

- Unsupported superlatives, professional experience, testimonials, or project metrics.
- Generic “digital experiences”, “innovative solutions”, “passionate developer”, or “crafting seamless experiences” filler.
- “Unlock the sacred portal” as the only label for signing in.
- Repeated section numbers, decorative eyebrow labels, identical icon cards, enormous blank gaps, and ornament used to fill missing content.

Keep the welcome and existing book turns as the cinematic signature. Let micro-interactions acknowledge intentional actions without making navigation wait for a long scene. Skip, reduced motion, keyboard use, and reading must remain dependable.

## Acceptance criteria

Before handing off, confirm:

1. Adonissimo leads and Lorenz’s name/full-stack focus are visible without navigating elsewhere.
2. The visitor can find Projects and Contact immediately, and planned work is clearly distinguished from real completed work.
3. All settings share type, navigation, control behavior, and theme preference; their scenery/materials differ appropriately.
4. Compactness comes from hierarchy and content organization, not tiny text or clipped prose.
5. Day/night text contrast and keyboard focus are checked; reduced motion preserves all content and controls.
6. Music, sound preferences, welcome, authentication, forms, and dashboard operations retain their established behavior.
7. Skeleton states reserve useful space and resolve to genuine content, errors, or empty states without artificial delay.
8. No invented facts, résumé links, clients, ratings, project screenshots, or unverified claims appear.
9. The handoff states exactly which source, automated, browser, and live-service checks ran.

### Motion and transparency refinement — 3.7.0

Lorenz clarified that PNG means transparent artwork without rectangular skies, and that transitions should move the text and images with magical visual/sound feedback. Full motion is the default, with no visible motion-reduction toggle; Replay welcome and independent music/effects controls remain. Use the existing automatic OS preference handling. The shared scenery now uses alpha PNGs; two transparent edits and existing sky/Lightroot art replace active opaque paintings. Keep transitions bounded, interruptible and separate from actual loading or backend state.

### Current motion direction — 3.8.0

Lorenz reported that none of the motion or Enter effects appeared, requested the original wide scenic footer instead of tiny centered islands, asked for an alive/breathing background with falling leaves, and added a winged fairy-orb cursor with a light trail. For this edition, honor the explicit full-motion choice even when the OS requests reduction; this supersedes the older automatic OS override guidance above. Keep an ambient-effects pause in the expanded dock, separate from page transitions and audio. Restore the wide footer from the original PNG paintings. Keep text input precision, bounded particle pools, touch exclusions and hidden-tab cleanup. See docs/LIVING_WORLD_UPDATE.md for actual evidence and remaining browser checks.

### Mobile and opening direction — 3.9.0

Keep the same TotK identity on phones, with readable single-column project rows, reachable Contact/navigation and comfortable controls. The fairy wings flutter slowly at rest and speed up with pointer motion; touch stays native. Environment rays follow day/night and the page realm, with mist and a slightly fuller leaf field behind reading content. The opening earns the strongest sequence: assembling Triforce, drifting forest atmosphere and one gold light release on Enter. A new original forest prelude attempts playback immediately without a sound button; never claim a browser can be forced to allow audible autoplay. Preserve Enter silently/Skip and hand off cleanly to the supplied Zelda’s Lullaby.

### Current opening and calm atmosphere — 3.10.0

Keep the fairy animated inside the welcome dialog as well as the page. Mist is fuller and layered at different depths, but rays and fog drift calmly with small travel and little brightness variation. Use the current PNG artwork as side mural panels with familiar carved geometry and a protected reading center. Enter earns a single white/ivory and yellow-gold Triforce zoom; this 820ms focal effect remains separate from the calm atmosphere. Preserve immediate Skip/Escape, silent entry, the audio handoff, mobile effect budgets and real backend behavior.

### Paper turn refinement — 3.11.0

Page turning should feel like flexible paper. Keep its spine attached while the free edge curls, with a soft moving shadow and a modestly slower 940ms desktop / 720ms phone timing. Reverse the bend for backward movement. Keep navigation prompt, welcome entry separate and the calm rays/mist unchanged; use a smaller phone geometry budget rather than switching off motion.

### Cinematic atmosphere visibility — 3.12.0

Fog must be visibly present from the opening through every page. Use textured cloud banks at different depths and pronounced light shafts with calm movement. Warm daylight, cool night and jade Depths/Zonai tones follow the established realms. Keep the effect in front of scenery, protect text, leave controls unobstructed, use a smaller phone budget and retain ambient pause. Existing PNG theme art remains; the moving cloud material is a native procedural canvas effect.

# Distinct environment backgrounds and PNG artwork — 3.6.0

The page background now changes its actual illustration with the route, in addition to the existing palette and foreground art.

| Page | Environment | Background source |
| --- | --- | --- |
| Home | Floating sky islands, pale gateways, hanging roots and a waterfall | `public/images/backgrounds/sky-atlas.png` |
| Projects and project details | Zonai workshop, carved stone walls and mechanisms | `public/images/backgrounds/zonai-atlas.png` |
| About | Hyrule fields, golden tree and field-journal landscape | `public/images/hyrule-atlas.png` |
| Contact | Quiet riverside, stone bridge, willow and Silent Princess flowers | `public/images/backgrounds/riverside-atlas.png` |
| Field notes and articles | The Depths, mineral columns and a Lightroot | `public/images/backgrounds/depths-atlas.png` |
| Sign-in, registration, recovery and private desk | Quieter Zonai setting | Workshop source at reduced opacity |

The five main public pages use five different image URLs. Route selection is centralized in `lib/realm-background.ts`, including nested detail pages and trailing slashes. It does not read browser storage or use random selection. The existing day/night preference, fonts, layout, authorization, cinematic welcome, music and selective skeleton loading remain.

Only the selected background image mounts. The layer is fixed, static, hidden from assistive technology, non-draggable and unable to intercept input. The original neutral reading wash and conservative contrast bound remain. There is no extra scene to scroll through or artificial loading delay. Privacy and unknown routes remain neutral.

## PNG artwork

All bundled raster theme illustrations and backgrounds now use PNG source files. The four previous WebP scene references were replaced with their original generated PNG files; their pixels were not redrawn or recompressed. The four new environment backdrops are transparent PNGs with open centers. About reuses the field atlas from 3.5.0, and the existing transparent relic PNGs remain. Exact prompts are embedded in PNG metadata and retained beside the images; `public/images/provenance.json` records all thirteen illustrations.

PNG is the source format, including files available directly under `/images`. Next Image retains normal responsive browser delivery and may negotiate an optimized format. Native interface geometry remains vector/code, and the real CMS upload pipeline/actual project covers remain intact. New artwork is original unofficial fan illustration, not official Nintendo imagery or evidence of a project outcome.

## Verification

- All 83 existing Node regression tests pass.
- Syntax parsing passes for 120 TypeScript, TSX and MJS files; this is not semantic type checking.
- Isolated component checks confirm five unique public backdrop sources, correct detail-route inheritance, quiet auth/admin, neutral exclusions, decorative semantics and real asset paths. Existing checks still cover published/planned links, skeleton/refresh states, landmarks, private navigation, audio controls and real CMS-cover priority.
- New backgrounds were visually inspected and decoded. Alpha, 1536 by 1024 dimensions, exact prompt metadata and unchanged pixels after provenance insertion were verified. The restored scene PNGs also preserve their original pixels.
- A full Next production build, TypeScript, ESLint, real browser desktop/mobile/theme screenshots, keyboard/zoom/hydration and live-service checks were not run here because the required installed dependencies/browser are unavailable. Previous successful operator gates were for 3.3.1. No deployment was performed.

## Continue on another computer

The source uses project-relative paths and site URLs; it does not depend on the former Windows folder location. Open the folder containing `package.json` on the new computer, use Node 24, retain the local configuration separately, and run the normal install/check commands. The new filesystem path is useful for tailored terminal instructions. A latest local project ZIP is only needed to merge edits that are not represented in this source update.

Merge this complete ZIP using the normal replace-files workflow. Preserve local environment settings, the existing lockfile and independent edits. Then run from the project folder:

```powershell
npm.cmd install
npm.cmd run check
```

After all four gates pass, run `npm.cmd run start` and inspect Home, Projects, About, Contact and Field notes. The background illustration should visibly change; About and Contact use different artwork despite sharing their palette. Inspect a project detail, an article and the quieter sign-in/private desk too.

The Sharp fix is retained. Existing moderate minimatch findings remain pending the operator's lockfile. Format and background changes do not certify a clean dependency audit.

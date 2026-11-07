# Page backdrop and typography — 3.5.0

## Background artwork

An original transparent Hyrule atlas painting now sits behind the public page canvas, beyond the existing framed scenery. It contains a ruined arch, floating islands, golden tree, mountain contours and field plants, with natural open space through the middle. Public pages use their existing realm palette; auth backgrounds are quieter. Private dashboard, privacy and other neutral routes omit the atlas.

The fixed backdrop adds no content height or interaction target. Its image uses Next Image with a responsive viewport size and decorative semantics. The reading wash transmits at most 3% of the artwork layer inside the main content width, reduced to 2% on narrow layouts. With the strongest artwork opacity of .6, the maximum center contribution is 1.8%. Existing text/gold/jade roles against a worst-case white/black center overlay calculate at least 5.38:1 across all eight realm/theme grounds. This is a conservative token calculation, not a full browser accessibility certificate. Surfaces and controls retain their solid backgrounds.

Source: `public/images/hyrule-atlas.png`, 1536 by 1024 with genuine alpha. The exact generation prompt is in `hyrule-atlas.prompt.txt` and embedded PNG metadata; provenance is recorded in `public/images/provenance.json`. It was created with the built-in image-generation tool, not a CLI fallback. This is original unofficial fan illustration, not an official game map, a project screenshot or a source of geographic information.

## Typography

| Role | Local face | Supplied files |
| --- | --- | --- |
| Public headings and wordmarks | Latin Modern Roman 10 | Regular 400 and actual italic 400 |
| Body, navigation, forms and private desk | Latin Modern Sans 10 | Regular 400 and bold 700 |
| Code | Existing monospace fallback | Unchanged |

The four WOFF files total 210,968 bytes. Original OTF files, the GUST Font License and upstream README/manifest remain in `app/fonts`; `FONT-SOURCES.txt` records the exact mapping. Conversion changed the container, not the font outlines or character mapping. The older DejaVu file remains historical material and is not imported. Font loading stays local through `next/font/local`, with `display: swap` and adjusted Times New Roman/Arial fallback metrics; there is no new remote font dependency.

The hero now has one continuous rem-based scale instead of becoming smaller immediately above 560px. Ordinary body copy is 1rem; the established compact spacing and bounded home projects remain. Header identity and music labels have readable small-text roles, and shared emphasis uses the supplied bold weight. Form control text remains 16px. The existing gold heading emphasis now uses a real italic face. Reading measures are capped around 70ch, and changed font metrics/long CMS titles are protected by zero-minimum text columns and wrapping.

## Review and limits

Two independent read-only typography assessments identified the old breakpoint discontinuity, tiny labels, missing italic face, arbitrary size cascade and long-content risks. Source changes address those findings. Written Taste/Impeccable guidance informed the refinement; their automated engine/inspection scripts were unavailable and are not reported as passing.

All 83 existing Node tests pass. Syntax parsing succeeds for 119 TS/TSX/MJS source files. Isolated component checks cover route-aware decorative backgrounds, quiet auth, private/neutral exclusion, existing skeleton/result states, project links, landmarks and audio controls. Font character mappings and glyph order survive container conversion, and metric estimates fit both actual hero lines at 320, 390, 560, 561, 768, 1000, 1440 and 1920px. A font specimen was inspected; it is not a browser render.

Full semantic TypeScript, ESLint, the Next production build, desktop/mobile/theme screenshots, fallback-font reflow, zoom, hydration and live-service checks were not run here because installed dependencies and a browser are unavailable. Earlier passing operator results were for 3.3.1, not this update. No Vercel deployment was performed.

## Apply

Merge the full ZIP into the existing project using the usual replace-files workflow, preserving `.env.local`, the existing lockfile and independent edits. From the project folder:

```powershell
npm.cmd install
npm.cmd run check
```

After all four gates pass, run `npm.cmd run start` and open http://localhost:3000. Inspect the backdrop and type on Home, Projects, Field notes, About and Contact, in day/night and phone/desktop layouts. Check keyboard focus, a long title, 200% zoom, the auth forms and expanded music controls.

The Sharp 0.35.5/type-import fix, real backend, selective loading, cinematic welcome and user-controlled persistent audio remain. The existing moderate minimatch audit findings are still pending the operator's lockfile.

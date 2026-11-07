# Phase 3 — Adonissimo frontend preview

Historical 2.x documentation. Version 3.0.0 retires public demo role selection and connects the dashboard to the backend. Use [PHASE_4.md](PHASE_4.md) for current behavior and setup.

Version 2.0.0 implements the public route set and an interactive dashboard using explicitly labeled demo records. The full Phase 3 checkpoint remains open until a successful production build, browser review, a Vercel preview and mentor review are recorded.

## Start and review

Extract the updated ZIP. Open `zelda-portfolio` in Visual Studio 2022, choose View → Terminal, and run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

Open http://localhost:3000. Music and the storybook welcome remain available. Open **Journal desk** in the header or `/login`, then choose **Explore as owner**, **editor**, or **viewer**. Use invented details in all demo forms. No password is stored or transmitted.

## Implemented source

| Surface | Behavior |
|---|---|
| `/`, `/about` | Existing cinematic home and dedicated owner/about/toolkit page |
| `/projects` | Search, technology-tag filters, 2-item pagination, empty state and truthful future slots |
| `/projects/[slug]` | Existing real-project case study |
| `/blog`, `/blog/[slug]` | Clearly labeled demo articles, static slugs, safe Markdown rendering, metadata |
| `/contact` | Per-field validation, local demo inbox write, error/success states, optional Turnstile client widget |
| `/privacy` | Preview-specific storage and data-handling notice |
| `/login`, `/signup`, `/forgot-password` | Validated form previews, OAuth preview feedback, public demo-role entry |
| `/admin` | Dashboard overview and demo reset |
| `/admin/projects`, `/admin/posts` | Create/edit/delete, unique slugs, draft/publish, Markdown live preview, project image preview and link fields |
| `/admin/messages` | Sample letters and contact submissions from the same tab; unread/read/archive/spam filtering/actions |
| `/admin/notifications` | Unread count and link to the inbox |
| `/admin/users` | Owner-preview role editor, with the original Owner record locked |
| `/admin/settings` | Independently stored demo email/confirmation/badge preferences |
| `/admin/audit` | Local UI activity preview |

The header and footer expose the new routes. Loading routes, global error/404 handling, dashboard storage-error/reset states and list empty states are included. Sitemap includes public routes and published fixture articles. Admin/auth routes are excluded from crawling; the admin layout also sets noindex.

## Demo boundaries

- A one-hour `adonissimo-demo-role` cookie set/cleared by Server Actions drives navigation guards in Next.js 16 `proxy.ts` and the server admin layout. It is a public role switch for UI review, **not authentication or secure RBAC**. Every visitor can choose Owner. Never add private data to this preview.
- Sample content is stored under `adonissimo-phase3-v1` in **sessionStorage**. It lasts within this browser tab across reloads and full navigations. A new tab starts a separate demo. Reset clears it; Sign out clears the role cookie. Ordinary sound/theme preferences keep their existing separate storage.
- Editor previews can create/edit/publish entries; Viewer previews are read-only. Only the Owner preview shows the inbox, notifications, users, settings and activity screens. These UI constraints and reducer tests do not fulfill Phase 4 authorization requirements.
- Public pages read repository content. Dashboard “Publish” demonstrates local workflow and does not change the server-rendered public site. Blog samples are labeled demo articles. Image selection previews locally; storage/resizing are not connected.
- Contact uses sample information and writes only to this tab’s demo inbox. No email, persistent server inbox, API, authentication, role-enforcement backend or database has been added.
- Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env.local` to show the real client widget with your configured public site key. Without a key the form explains its preview state. Tokens are not verified server-side in this phase, and the widget does not secure this local demo. No Turnstile secret belongs in a public environment variable.
- Markdown supports headings, paragraphs, lists, quotes, fenced code, bold, inline code and safe links. Raw HTML is escaped. Tables, embedded HTML and plugins are deliberately unsupported in this preview renderer.

## Acceptance walkthrough

1. Run `npm.cmd run check`. Test the production build with `npm.cmd run start` after it passes.
2. At 375px, 768px and 1280px, in day/night modes and at 200% zoom, visit every public route. Use keyboard only; check focus, labels, menus, forms and reduced motion.
3. Search Projects for a nonexistent term, clear filters, select a technology and page forward/back. Planned entries must have no fabricated detail/demo links.
4. Read each demo post; confirm code, lists and links render and raw HTML cannot execute. Try an unknown article and project URL for the 404.
5. Submit invalid sample contact details; check field errors and focus. Submit a valid fictional message. In the same tab, enter the Owner demo and inspect Messages and the unread badge. Mark Read/Archived/Spam and filter each state.
6. Create/edit a project, try a duplicate or invalid slug, preview a small image, publish/unpublish and delete. Edit a Markdown post and watch the live preview. Verify errors preserve the draft. Cancellation returns to the list.
7. Sign out and repeat as Editor and Viewer. Test direct `/admin/users` navigation as Viewer; it must show the Owner-only preview message. Sign out and try `/admin`; the navigation guard redirects to login.
8. Change notification preferences and a sample user’s role. Reload to verify same-tab persistence. Reset demo data. Simulate blocked/corrupted session storage and use the recovery state.
9. Check audio continuity through all client navigation, background tabs, silent entry, randomized interaction sounds and reduced motion.
10. Configure the optional Turnstile key and test success, expiry and blocked-script states. Complete real server verification only in Phase 4.

## Verification and outstanding checkpoint

63 Node tests passed, including 12 frontend-demo behavior tests and 7 shared-store tests. All TS/TSX sources were syntax parsed and local imports checked. These are not browser tests, backend business tests or server authorization tests.

A fresh `npm install` failed with HTTP 403 from the registry. Dependencies, TypeScript semantic checking, ESLint, a Next production build and desktop/mobile browser validation could not run here. No performance/accessibility certification is claimed.

No GitHub or Vercel account/repository is connected to this workspace, so no hosted preview URL was created. After local checks pass, push this folder to your repository (including the generated package-lock.json), import it in Vercel as Next.js with Node 24, and set `NEXT_PUBLIC_SITE_URL` to the actual preview/deployment origin. See README for deployment steps. Share the resulting preview with the mentor for the Phase 3 phone review.

Phase 4 still supplies database migrations, actual auth/OAuth/recovery, server RBAC/RLS, saved content, production contact/Turnstile validation, email jobs, storage, durable notifications/audits and health checks.

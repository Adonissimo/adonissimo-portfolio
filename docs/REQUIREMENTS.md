# DevFolio requirements — Lorenz's Zelda portfolio

Status: planning baseline for the Phase 1 checkpoint. These are acceptance requirements, not claims about the current build. The full activity is preserved in [ACTIVITY_GUIDELINES.md](ACTIVITY_GUIDELINES.md). Actual implementation status is in [STATUS.md](STATUS.md).

## Product and scope

DevFolio is Lorenz Anthony Salvador's portfolio and content management system. Its public identity is **Adonissimo — A Hyrule Field Journal**, explicitly themed around The Legend of Zelda. The public site helps visitors understand Lorenz's work; a private dashboard manages projects, blog posts, incoming messages, users, and settings without editing source files.

The required final deliverable is a live public website, custom domain, public GitHub repository, protected CMS, real backend, measured quality results, and documentation. The existing Next.js project is an initial public-site implementation. Installing a modern framework alone does not complete this activity.

Architecture baseline: **Track A, Supabase**, with Next.js/React/TypeScript/Tailwind on Vercel, Supabase Auth/Postgres/Storage, Resend, and Cloudflare DNS/Turnstile. This is a planning choice; no accounts, paid plans, DNS changes, or deployment have been provisioned.

## Functional requirements

All FR-01–FR-21 from the activity are retained. Terms below distinguish the authenticated Viewer role from a signed-out Guest.

| ID | Required behavior | Acceptance evidence |
|---|---|---|
| FR-01 | People can register and sign in with email and password using the auth provider. Confirm ownership of the email before dashboard access. | Valid registration/login works; invalid credentials fail without leaking whether an address exists. |
| FR-02 | People can sign in with GitHub OAuth. | An allowed OAuth callback creates or retrieves the account and applies the normal role policy. Redirects cannot target arbitrary websites. |
| FR-03 | A person can request a password-reset email and set a new password from a valid recovery session. | Reset works; expired/reused recovery links fail safely; request responses do not enumerate accounts. |
| FR-04 | A user can sign out and loses access after inactivity. Proposed application idle limit: 30 minutes; absolute lifetime: 7 days. | Server checks reject an expired session even when the browser UI or cookie is altered. Background polling must not keep an idle user active. Test logout/recovery behavior and provider-token expiry separately. |
| FR-05 | Signed-out visitors cannot render any `/admin` page. | Direct admin navigation redirects to login with a safe local return path. Protected APIs return 401 rather than login HTML. |
| FR-06 | Every registered account has one role; all new accounts start as Viewer. | Database constraints enforce one non-null role. Signup metadata cannot grant Editor or Owner. |
| FR-07 | Only the Owner changes roles. | Editor/Viewer direct requests and direct database attempts cannot promote themselves. Prevent removing the last Owner. |
| FR-08 | The server rejects actions outside the actor's permission. | Authenticated forbidden requests return 403; RLS tests independently prove forbidden data access fails. |
| FR-09 | Dashboard controls reflect permissions. | Viewer has no mutation controls; Editor has content tools; Owner has user/settings tools. API enforcement still works when controls are bypassed. |
| FR-10 | The CMS supports project creation, reading, editing, and deletion, including descriptions, tags, images, live URLs, and repository URLs. | CRUD persists through a reload; links and images are validated; Owner-only deletion is enforced. |
| FR-11 | Projects have separate Draft/Published publication status. | Public queries never return drafts. Publishing/unpublishing updates public caches. Publication status is independent of a project's planned/built/deployed stage. |
| FR-12 | Visitors filter projects by technology tag and move through paginated results. | Filtering occurs against persisted tags; filter/page state is linkable; page size cannot exceed 50. |
| FR-13 | Editors write Markdown posts with live preview and unique slugs. | Draft/published post management works; preview and server rendering disable unsafe HTML and executable links; duplicate slugs return a clear conflict. |
| FR-14 | The contact form accepts name, email, subject, and message and saves valid submissions to a private inbox. | Server schema, Turnstile, and rate-limit checks run before persistence. A success response means the database committed the message. |
| FR-15 | The Owner marks inbox messages read, archived, or spam. | State changes persist and update the unread badge. Permanent removal follows the deletion policy. |
| FR-16 | Authorized content managers upload images to object storage; a background job validates and resizes them. | Private original uploads cannot be publicly read; only validated derivative images become available. Oversized, invalid, or malicious files are rejected. |
| FR-17 | Every business create/update/delete operation records its actor, action, entity, and time. | Content, role, settings, message, and media changes have an audit entry in the same transaction where applicable. Logs omit secrets and raw message bodies. |
| FR-18 | A new contact message queues an email notification to the Owner. | Delivery is observed using a configured mailbox and provider event, with retry/failure evidence. |
| FR-19 | The Owner sees a badge showing unread inbox messages. | Count reflects persisted unread messages, updates after submission/state changes, and recovers after reconnect. No private inbox data is exposed to demo Viewers. |
| FR-20 | A valid contact sender receives a confirmation email explaining the expected reply window. | Confirmation is queued independently from the Owner email; retries avoid duplicate sends within the provider's idempotency window. |
| FR-21 | The Owner controls notification preferences. | Owner-email, sender-confirmation, and in-app badge settings persist and are checked by the server/worker, not only by the UI. |

## RBAC permission matrix

This is the initial least-privilege interpretation of the activity. Editors may publish content as part of editing it. Destructive content deletion, inbox access, users, private settings, and full audit records belong to the Owner. Demo Viewers see a read-only content dashboard, not visitors' messages or a user directory. These choices are explicit additions for review at the planning checkpoint.

| Action | Guest | Viewer | Editor | Owner |
|---|---|---|---|---|
| Read published public projects/posts/settings | Yes | Yes | Yes | Yes |
| Send a validated/rate-limited contact message | Yes | Yes | Yes | Yes |
| Read non-sensitive dashboard and draft content | No | Yes | Yes | Yes |
| Create/edit/publish projects, posts, tags | No | No | Yes | Yes |
| Upload/process content images | No | No | Yes | Yes |
| Delete projects/posts/tags/media | No | No | No | Yes |
| Read, classify, or delete contact messages | No | No | No | Yes |
| Read private user directory or change roles | No | No | No | Yes |
| Delete another account | No | No | No | Yes, with last-Owner protection |
| Edit site/notification settings | No | No | No | Yes |
| Read full audit log | No | No | No | Yes |
| Change password or end own session | No | Self | Self | Self |
| Read/mark own non-sensitive notifications | No | Self | Self | Self |

Roles come from server-controlled database records. A client field, hidden button, localStorage value, or unverified session is never an authorization source. Background workers have narrow internal service authority, not a fourth end-user role.

## User stories

1. As a Guest, I want to filter published projects by technology so that I can quickly find work relevant to me.
2. As a Guest, I want to send a message and receive confirmation so that I know my inquiry was saved.
3. As an Editor, I want to preview a Markdown draft before publishing so that I can check its content and layout.
4. As a Viewer, I want to explore a read-only dashboard so that I can assess the product without changing it or reading private correspondence.
5. As the Owner, I want to change roles on the server so that I can safely delegate editing.
6. As the Owner, I want an inbox, email alert, and unread badge so that I do not miss inquiries.
7. As a keyboard user, I want every public and admin workflow to work without a mouse so that I can use the complete product.

## Non-functional requirements

All 22 activity targets are retained. A target is not a result; unknown measurements remain unverified.

| ID | Target | How it will be accepted |
|---|---|---|
| NFR-01 | Mobile Lighthouse performance score at least 90. | Record three runs per representative public route on the production build; report device/network settings and median, with screenshots. |
| NFR-02 | LCP under 2.5 seconds. | Record lab results and available Vercel field data; label missing/low-volume field data instead of treating it as a pass. |
| NFR-03 | API p95 response latency under 300 ms. | Use a documented representative workload including cold arrivals. Report per-route sample size, region, errors, and external verification time; do not silently exclude slow routes. |
| NFR-04 | Public pages are statically generated or edge-cached. | Record production response/cache headers and demonstrate content refresh after publication. No session-bearing response is shared in a public cache. |
| NFR-05 | Raster images use WebP/AVIF where supported and lazy loading outside the initial viewport. | Use `next/image` for uploaded images; inspect network responses and dimensions. Vector theme art stays SVG; do not lazy-load the LCP asset. |
| NFR-06 | Frontend instances remain stateless. | No durable data, upload state, jobs, or rate limits depend on one function's memory or filesystem. |
| NFR-07 | All lists are paginated, with no page returning more than 50 records. | Validate requested limits on the server and test excessive/negative values. Database count aggregates are allowed; unrestricted row dumps are not. |
| NFR-08 | Common slug/status/tag lookups have indexes. | Review migrations and representative query plans for slugs, publication status, tag joins, and list ordering. |
| NFR-09 | Emails and image processing run through durable background jobs. | Kill/retry a worker and show the committed message/upload remains recoverable; no fire-and-forget promise is accepted as a queue. |
| NFR-10 | Public traffic uses HTTPS with HTTP redirected. | Test final custom domain and redirects, including the chosen Cloudflare/Vercel configuration. |
| NFR-11 | The application never stores plaintext passwords. | Delegate password storage/recovery to Supabase Auth; inspect schema, logs, and seed procedures. |
| NFR-12 | Secrets stay in environment variables and out of Git and browser bundles. | Separate public keys from server secrets, run a secret scan, inspect client bundles, and use separate preview/production values. |
| NFR-13 | All mutations and query inputs are server-validated. | Shared Zod schemas are re-run server-side; invalid, unexpected, and oversized fields produce documented errors. |
| NFR-14 | Contact submission has server-verified Turnstile and distributed rate limiting. | Test missing, expired, replayed, wrong-host/action tokens, provider failure, and quota exhaustion. Auth endpoints also have rate limits. |
| NFR-15 | CSP, X-Frame-Options, and HSTS are present and effective in production. | Inspect deployed headers and report securityheaders.com result. Test hydration, OAuth, image loading, and Turnstile under the policy. |
| NFR-16 | A privacy page explains collection, use, retention, processors, and a deletion-request path. | Demonstrate verified deletion handling and retention jobs. Review against the Philippine Data Privacy Act; a policy page alone is not a legal-compliance claim. |
| NFR-17 | OWASP Top 10 review is documented. | Keep a dated finding/evidence/remediation table and resolve critical/high findings before release. |
| NFR-18 | Availability target is 99.5%. | Monitor the public site and database health endpoint for seven days and report actual observations and outages. |
| NFR-19 | `/health` verifies database reachability. | Return 200 for a successful bounded DB probe and 503 on failure without exposing credentials, stack traces, or raw database errors. |
| NFR-20 | Daily database backups exist and are restorable. | Document the selected plan, backup schedule, encrypted storage/retention, failure alerts, and a test restore to a separate environment. Do not assume free plans include backups. |
| NFR-21 | Errors are tracked with sensitive data removed. | Configure Sentry for browser/server/worker paths; induce a test error and inspect redaction and correlation IDs. |
| NFR-22 | Backend failure does not crash cached public pages. | Simulate a DB outage and show existing published content or a truthful friendly unavailable state. Admin and contact errors must not falsely report successful writes. |

## Additional engineering rules

- Use a shared schema for input shape, but authorize every server mutation independently of client validation.
- Protect cookie-authenticated mutations from cross-site requests; reject unsafe origins, enforce appropriate CSRF controls, and restrict OAuth return URLs to the configured application.
- Bootstrap the first Owner through a trusted operator script after verifying the intended account. Never promote a registration based on its submitted role or email alone.
- Protect the last Owner from concurrent demotion/deletion. Roles must update immediately on the next protected operation rather than waiting for an old JWT claim to expire.
- Keep draft/published status separate from the project's planned/built/deployed lifecycle stage. The current local `built`/`planned` data is not a publication workflow.
- The contact endpoint persists a message and durable email jobs transactionally; the browser receives a saved acknowledgment, not a fabricated email-delivery result.
- Browser content contains no passwords, privileged Supabase key, SMTP/API credential, queue token, or backup credential.
- Markdown must not execute raw HTML or arbitrary JavaScript. External links and media URLs require protocol/host validation.
- No sample messages or demo credentials may expose real people. A public Viewer account requires an isolated, limited dataset.

## Initial validation limits and cost decisions

The current environment cannot download npm dependencies. The existing four Node content/URL/theme tests passed earlier; those are not the required business-logic/RBAC suite. Full typecheck, lint, production build, browser tests, Lighthouse, real auth, email delivery, and deployment remain unverified.

Supabase's managed session-lifetime/inactivity controls require Pro or higher and apply when a session refreshes; they must not be assumed to provide an exact free-tier 30-minute activity timeout. The architecture therefore specifies a server-enforced application idle record as the free-tier baseline. It must be implemented and tested before FR-04 is accepted. Any purchase or upgrade remains an explicit owner decision.

Plan availability and quotas for backups, job scheduling, email, monitoring, analytics, and WAF controls must be checked before provisioning. A custom domain is an external prerequisite; this plan does not buy one or change DNS.

## Checkpoints and release evidence

| Phase | Required checkpoint artifact/demo |
|---|---|
| 1 | This requirements document, RBAC matrix, stories, measurable targets, and answers to mentor questions. |
| 2 | [ARCHITECTURE.md](ARCHITECTURE.md): topology, rendering choices, boundaries, schema/ERD, API contract, and trade-offs. |
| 3 | Public/admin UI preview on Vercel, explicitly labeled if using test data; responsive and keyboard review. |
| 4 | Persisted CRUD, auth, server/database RBAC, notifications, media, audit log, health endpoint; at least five unit tests and three genuine authorization-denial tests. |
| 5 | Custom domain, production/preview separation, protected main branch, CI, monitoring, backup/restore and deployment evidence. |
| 6 | Recruiter-readable README, real screenshots, limited Viewer demo, NFR results, and the 15-minute walkthrough. |

Stretch goals stay out of the required baseline until these checkpoints are complete. Checkpoints show reviewable work before the next phase; no unchecked phase is represented as finished.

## Phase 1 mentor answers

1. **Why server RBAC?** A visitor can change browser code or call an API directly. The trusted server and database must enforce the permission, regardless of which UI was displayed.
2. **Which free-tier target is hardest?** Consistently low API latency and recovery/availability evidence are vulnerable to cold starts and service limits. Daily tested backups also require an explicit plan; none may be declared met just because a provider is selected.
3. **Working versus reliable contact?** A single saved test message demonstrates a feature. Reliability adds durable persistence, retries, duplicate protection, monitoring, failure feedback, privacy handling, and evidence across failures.

## Primary technical references

- [Supabase Next.js SSR clients](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase session controls and plan limitations](https://supabase.com/docs/guides/auth/sessions)
- [Cloudflare Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [National Privacy Commission: Data Privacy Act](https://privacy.gov.ph/data-privacy-act/)

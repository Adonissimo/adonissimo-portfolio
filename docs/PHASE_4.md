# Phase 4 — Supabase backend integration

Version 3.0.4 supplies the backend and connected UI source. It has not provisioned your accounts, applied a live database migration, delivered real email, or completed a production build in the authoring environment. Phase 4 acceptance remains open until the checks below run against your configured services.

Latest user-reported progress: the site is deployed to Vercel and Google sign-in now works. That covers the activity's third-party-login requirement (GitHub **or** Google), while the Phase 4 permission-denial, contact-delivery/badge and audit demonstrations remain open. See [STATUS.md](STATUS.md) for the current evidence and checkpoint.

## What changes from Phase 3

- Real email/password signup, confirmation, login, logout, password recovery/reset, and GitHub/Google OAuth routes replace public demo role selection.
- Verified Supabase claims and an authoritative profile role protect the server. RLS independently protects database reads/writes. Viewer reads non-sensitive content; Editor creates/edits/publishes; Owner deletes content and manages inbox/users/preferences/audit.
- Projects, posts and tags persist in Postgres. Draft/publication changes affect public pages and APIs. New slugs no longer require a rebuild. Conflicting edits return 409 and leave the open editor intact.
- Contact submissions require server-verified Turnstile, consent and shared rate limits. Message, notification and mail-job records commit together. Submission identifiers make acknowledged retries idempotent.
- The private storage bucket keeps originals and processed files private. Server-validated PNG/JPEG/WebP uploads produce a metadata-stripped WebP derivative, bounded to 1600 × 1600. Only derivatives attached to published entries are publicly served.
- Database triggers create redacted audit entries in the same transaction as mutations. Owner role changes serialize the last-active-Owner safeguard.
- An authenticated outbox worker leases jobs, uses Resend idempotency keys, retries transient failures and stops automatic retries before the provider's 24-hour deduplication window expires.
- The unread badge polls its protected endpoint every 15 seconds while visible. This is HTTP polling, not a Supabase Realtime subscription. Passive polling does not keep an idle session alive.
- Application sessions expire after 30 minutes without activity or 8 hours total. The database checks eligibility too; a valid JWT alone cannot bypass the app timeout. Login/callback establishes sessions through service-only bookkeeping, and expired rows cannot be revived by a heartbeat.
- `/health` performs a fresh database RPC and returns 503 when unavailable.

The cinematic welcome, Zelda art, day/night themes, storybook transitions, automatic randomized effects, continuing Zelda's Lullaby and minimizable audio dock are retained.

## Guided setup in version 3.0.1

The complete update includes an interactive setup wizard. Save/close your `.env.local` editor tab first so an unsaved buffer cannot overwrite the wizard's changes, then run `npm.cmd run setup` from the project folder. It needs Node.js 24 but does not require installing dependencies beforehand.

Paste your Project URL, publishable key and secret key into that local terminal; inputs for keys/passwords are hidden. Enter your Owner email and choose a password. The wizard derives the project reference from the canonical URL, generates application secrets, preserves unrelated environment settings, and keeps the Owner password out of `.env.local`. It sets the local site origin to http://localhost:3000. It uses existing selected keys if you press Enter to keep them.

It runs dependency install and all local check stages before touching the database. It then opens the Supabase CLI login, links your selected project, applies migrations and runs the Owner seed script. Complete the browser login yourself; enter your database password if the CLI asks. A failure stops subsequent stages. Re-running uses the saved local configuration and existing migration tracking.

This is a user-run local workflow. ChatGPT does not receive your credentials or gain account access. It does not configure provider dashboard settings, purchase services, or deploy to Vercel. The remaining manual integration and live acceptance steps below still apply. No live or Windows handoff is claimed to have passed here.

## 1. Install the complete project update

Keep a backup of your current project and preserve your own `.env.local` and `package-lock.json`. Extract all source files from the new archive; this release adds many routes, helpers and migrations. Do not apply only the small file lists from earlier repair messages.

In Visual Studio 2022, open View → Terminal in the `zelda-portfolio` folder:

```powershell
npm.cmd install
```

This updates the lockfile for the added Supabase and Sharp packages. Node.js 24 is required. Keep the resulting lockfile with your repository. The supplied version ranges are compatibility baselines; a successful installation/build is still required before release.

Merge the new fields from `.env.example` into your existing `.env.local`. For a new checkout without that file:

```powershell
Copy-Item .env.example .env.local
```

Do not paste private keys, passwords or `.env.local` contents into chat or commit them. The example files contain blank placeholders only.

## 2. Create the Supabase development project

Use a dedicated project at https://supabase.com/dashboard. Record its Project URL, publishable key, secret key and database password locally. Keep development and production data separate.

Set these in `.env.local`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project's HTTPS API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key; browser-safe |
| `SUPABASE_SECRET_KEY` | Secret/service-role key; server only |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for local development; the exact HTTPS site origin in Vercel |
| `PRIVACY_CONTACT_EMAIL` | Your real address for privacy/deletion requests |
| `RATE_LIMIT_SECRET` | A generated random secret of at least 32 characters |
| `JOBS_SECRET` | A different generated random secret of at least 32 characters |

Generate each random secret independently with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The private schema `portfolio_private` must stay outside Supabase's exposed API schemas. Keep `public` exposed for application tables and invoker RPCs. Do not add direct browser policies for the private storage bucket.

## 3. Apply version-controlled migrations

Use the Supabase CLI from your project folder:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_PROJECT_REF
npx.cmd supabase db push
```

Replace `YOUR_PROJECT_REF` with your actual project reference. The CLI may request your database password. Both files in `supabase/migrations` belong in the same deployment. Do not hand-create duplicate tables in the dashboard. The migration starts a transaction and explicitly grants access rather than relying on Supabase defaults.

## 4. Bootstrap the real Owner account

Temporarily set `OWNER_BOOTSTRAP_EMAIL` to your own address and `OWNER_BOOTSTRAP_PASSWORD` to a unique password of 12–128 characters in `.env.local`, then run:

```powershell
npm.cmd run seed
```

This privileged operator script creates/confirms the initial Owner account, assigns its role through a service-only RPC, and seeds the existing portfolio case study and tags. Existing CMS entries are not overwritten. It refuses to take ownership when a different active Owner already exists. An existing unconfirmed account must be confirmed before promotion. It does not reset an existing account's password.

Remove the bootstrap password from `.env.local` after confirming sign-in. Do not put it in Vercel. New visitor signups always receive Viewer access; there is no public “Explore as Owner” button.

## 5. Configure authentication email and OAuth

In Supabase Auth:

1. Enable email/password signup and keep email confirmation enabled. Set the minimum password length to 12.
2. Set Site URL to the current application's exact origin. Add the exact `/auth/callback` and `/auth/confirm` URLs to allowed redirects. For localhost, use `http://localhost:3000`; for Vercel, use your chosen HTTPS preview origin. Update this before testing a new origin.
3. Configure custom SMTP for real signup/recovery delivery. Supabase's default email service restricts delivery to project-team addresses and is not a general production mail service. You can configure Resend SMTP using its verified sender/domain and the current credentials shown by Resend.
4. In the Confirm signup template, use a token-hash link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your account</a>
```

5. In the Reset password template:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

OAuth uses PKCE code exchange at `/auth/callback`. To enable GitHub and Google, create each provider's OAuth app, configure its credentials inside Supabase Auth, and use the callback URL shown by Supabase (normally its `/auth/v1/callback`). These provider secrets do not belong in browser variables. Keep the app callback URL in Supabase's redirect allowlist. Unconfigured OAuth buttons return a useful failure rather than signing in a demo user.

The app uses an HTTP-only cookie, server-mediated auth model. There is no browser Supabase session client. If you enable Supabase's separate Auth CAPTCHA setting, integrate and test its tokens before rollout; the supplied Turnstile component is for contact submission.

## 6. Configure contact verification and email

Create a Cloudflare Turnstile widget and allow your actual local/preview hostnames. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and server-only `TURNSTILE_SECRET_KEY`. Verification checks success, exact allowed hostname and action `contact`. There is no production bypass when a token or secret is absent. Use your configured widget for an end-to-end check; dummy test keys are not an acceptance test of real verification.

In Resend, configure your sender/domain and set `RESEND_API_KEY` and `RESEND_FROM`. The latter is an actual authorized sender, for example your chosen display name and address on the verified domain. Resend's testing restrictions must be resolved before arbitrary visitor confirmation emails can be demonstrated. Configure custom SMTP separately in Supabase for Auth emails.

The contact UI stays disabled until its required services and privacy contact are configured. A successful response means the message and jobs committed; it does not claim the provider delivered an email. Provider failures leave the message intact. The Owner preferences control owner email, visitor confirmations and new-message badge creation. With multiple Owners, a visitor receipt is queued if any active Owner enables confirmations.

## 7. Enable durable email retries

Contact acceptance starts an immediate best-effort batch through Next.js `after`. For retries after provider outages, configure a recurring scheduler too.

The optional operator-run `supabase/schedule-mail.sql` uses pg_cron/pg_net every minute. Before running it, create these Vault secrets through your Supabase project dashboard:

- `portfolio_app_origin`: the exact deployed HTTPS app origin.
- `portfolio_jobs_secret`: the same private value as `JOBS_SECRET` in Vercel.
- `portfolio_vercel_bypass`: only if your selected preview is protected by Vercel Authentication; use an authorized automation bypass secret. Otherwise omit it.

The scheduler calls POST `/api/jobs/email` with a Bearer credential. It is not installed automatically and is separate from migrations so a new database does not start making network calls unexpectedly. Restrict database administrator/log access: pg_net briefly holds the authorization header in its request queue. Run the schedule script once and inspect its job history; do not create duplicate schedules.

Jobs use two-minute leases and lease tokens. Transient failures retry with exponential delays, up to six attempts; retries older than 23 hours after the first attempt become `dead`, avoiding automatic resend beyond Resend's 24-hour deduplication window. Review dead jobs in the private schema before any manual retry. Do not bulk-reset them blindly.

## 8. Verify the actual application

Version 3.0.4 adds `npm.cmd run checkpoint -- --url https://zelda-portfolio-tawny.vercel.app` for the three required demonstrations. See [PHASE_4_CHECKPOINT.md](PHASE_4_CHECKPOINT.md). It needs real local Owner/Viewer credentials and your browser/contact/email observations; it has not established a live PASS from this chat.

```powershell
npm.cmd run check
npm.cmd run start
```

After a successful build, test the production server at http://localhost:3000. The source check runs unit tests, TypeScript, ESLint and Next build and returns nonzero if any stage fails or is blocked.

Use the real Owner to create a draft project/post, save, publish, open its public URL, unpublish and confirm the public API returns 404. Refresh in a different browser/tab to prove persistence. Upload a real image and inspect the processed image response. Try simultaneous editors to exercise the 409 conflict path.

Register and confirm separate Editor and Viewer test accounts, then assign Editor through the Owner's Users screen. Keep a Viewer without extra permissions. Copy `.env.integration.example` to `.env.integration`, set its test URL and dedicated account credentials, and run:

```powershell
npm.cmd run test:integration
```

These eight HTTP tests perform real login and prove Viewer creation/deletion denial, Editor deletion/role/inbox denial, rejection of the retired demo cookie, and public draft exclusion. Missing setup is a failed setup, not a skipped pass. Use a dedicated test deployment/database; the test creates and deletes one disposable project and signs its test sessions out.

For direct database-policy tests, install Docker and use a disposable local Supabase stack:

```powershell
npx.cmd supabase start
npx.cmd supabase migration up --local
npx.cmd supabase test db
```

The pgTAP script has 12 assertions and rolls back its fixtures. It tests real RLS/grants, self-promotion denial, private message access, media-path forgery denial, private worker denial and expired-session behavior. These tests have not run in the authoring environment.

Finally, submit a fictional contact message with a real challenge and show both Owner and sender emails arriving, the badge changing within 15 seconds, message state synchronizing notifications, and an audit entry after a content edit. Test expired/revoked sessions, demotion, CSRF rejection, oversized uploads, keyboard/mobile controls and the audio dock.

## 9. Update the Vercel preview

Set the environment variables in the Preview environment, including its exact public URL and backend/mail/verification configuration. Keep bootstrap and test passwords local. Redeploy:

```powershell
npx.cmd vercel@latest deploy --target=preview
```

Check `/health` at the deployed URL, then repeat the live checkpoint there. HTTPS is required for deployed auth cookies. A Vercel build does not apply database migrations; apply them as a separate controlled step before exposing the new app.

## Actual verification and remaining work

- 83 Node tests pass here: 63 existing regression tests, eight backend business/validation tests, four setup configuration tests and eight checkpoint-runner tests.
- Source syntax and local import references were checked. They are not TypeScript semantic or runtime verification.
- npm installation failed with HTTP 403 for `@supabase/ssr`. TypeScript, ESLint and production build remain blocked in the authoring environment.
- No live Supabase project, migrations, pgTAP/HTTP integration run, OAuth exchange, Turnstile acceptance, email delivery, scheduler or browser result has been verified here.
- Public database pages use fresh anonymous SSR reads with no shared auth cookies. This deliberately replaces the earlier proposed ISR until cache correctness/performance is measured. Processed public images use a 60-second cache lifetime; unpublishing can therefore leave an already-cached derivative visible for that interval.
- The server-bound API model uses polling rather than direct browser Realtime. Notifications, original-file confidentiality and session checks still rely on the actual RLS and configured scheduler passing the acceptance tests.
- The shared local/non-Vercel rate bucket is deliberately conservative. The Vercel deployment uses its trusted client-IP header. Reassess proxy topology before running on another host; do not trust arbitrary forwarded-IP headers.
- Media upload cancellation/unattached files can leave private orphans; automatic orphan cleanup, backups/restore, monitoring, CI, a measured CSP/security review, a formal retention schedule and release NFR evidence remain Phase 5–6 work.

## Implemented HTTP contract

All write endpoints require an accepted same-origin request except the credential-authenticated mail worker. JSON writes are size-bounded; uploads use bounded multipart data. Error responses contain a safe message, optional field errors and a request ID. Protected routes independently verify claims, application-session eligibility and the current database role. API access is not granted by the navigation proxy alone.

| Method | Path | Access / behavior |
|---|---|---|
| POST | `/api/auth/login`, `/signup`, `/forgot-password` under the same `/api/auth` prefix | Shared/account rate limits; real provider operation |
| POST | `/api/auth/oauth` | Provider allowlist: GitHub or Google; returns external authorization URL |
| POST | `/api/auth/reset-password` | Verified eligible user session; updates credentials and signs this app session out |
| POST | `/api/auth/logout` | Revokes this app session and clears this browser's auth cookies |
| GET | `/auth/callback`, `/auth/confirm` | Provider PKCE/OTP proof; local allowlisted destinations |
| GET | `/api/content/projects`, `/api/content/posts` | Anonymous published-only, bounded page/limit, title query and tag filter |
| GET | `/api/content/{projects,posts}/[slug]` | Published detail or 404 |
| GET | `/api/admin/projects`, `/api/admin/posts` | Any authenticated application role, including draft content |
| POST / PATCH | `/api/admin/{projects,posts}` and `/[id]` respectively | Editor/Owner; full validated entry; PATCH includes the last `updated_at` revision |
| DELETE | `/api/admin/{projects,posts}/[id]` | Owner only |
| GET / POST / PATCH / DELETE | `/api/admin/tags` and `/[id]` as appropriate | Read: all roles; create/edit: Editor/Owner; delete: Owner |
| GET / PATCH / DELETE | `/api/admin/messages` and `/[id]` as appropriate | Owner; bounded inbox pages and validated status changes |
| GET / PATCH | `/api/admin/users`, `/api/admin/users/[id]` | Owner; role/active fields only; last Owner protected |
| GET / PATCH | `/api/admin/settings` | Current Owner's notification preferences |
| GET / PATCH | `/api/admin/notifications`, `/[id]` | Current Owner's unread records/count and mark-read action |
| GET | `/api/admin/audit` | Owner; latest 100 redacted entries |
| POST | `/api/admin/media` | Editor/Owner; validate/re-encode actual image; private storage |
| GET | `/api/admin/media/[id]` | Editor/Owner; private no-store derivative preview |
| GET | `/media/[id]` | Anonymous published-attachment derivative only; no original download |
| POST | `/api/contact` | Configured service, rate limits, consent, Turnstile and idempotency |
| POST | `/api/session/activity` | Eligible verified account; bounded real-user activity refresh |
| POST | `/api/jobs/email` | Constant-time Bearer-secret check; claim/send/ack a bounded batch |
| GET | `/api/session` | Verified current user ID/role only; no idle-session touch |
| GET | `/health` | Fresh public database probe; 200/503, no credentials or provider details |

Responses distinguish malformed/unsupported input (400/413/415/422), missing identity/expired sessions (401), denied roles/origins (403), missing records (404), conflicting changes (409), request limits (429), generic internal errors (500) and service availability/configuration failures (503). No success is returned for a failed database mutation.

## Primary implementation references

- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/functions/schedule-functions
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://resend.com/changelog/idempotency-keys
- https://vercel.com/docs/headers/request-headers

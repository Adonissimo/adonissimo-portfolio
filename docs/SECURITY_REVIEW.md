# Local security review — 2026-11-13

Scope: non-destructive source review and six HTTP probes against a local production server. This is a limited assessment, not a comprehensive penetration test or a guarantee against compromise.

## Results

- Source tests: 117 passed; two additional secret-scanner regression tests passed.
- TypeScript and ESLint: passed.
- Production build: passed (`next build`).
- Dependency audit: `npm audit --audit-level=high` reported zero known vulnerabilities.
- Secret scan: no recognized private keys or copies of local private environment values found in source, public assets or freshly built browser bundles. Pattern scanning cannot detect every possible credential format.
- Local HTTP: `/.env.local` and `/.git/config` returned 404; anonymous `/api/admin/projects` and unauthenticated POST `/api/jobs/email` returned 401; foreign-origin POST requests to contact and login returned 403. All six responses included `X-Content-Type-Options: nosniff`.
- Browser/layout verification: not performed.
- Live-service evidence: deployed Supabase RLS, real account role boundaries, storage policies, credential validity, email and Turnstile were not exercised. Dedicated integration accounts were not configured.
- Deployment: no production deployment performed or verified. GitHub publication uses an isolated checkout of Adonissimo/adonissimo-portfolio because the local project inherits an unrelated Downloads repository. Application source matches the checkout after normalizing line endings; the remote dependency lockfile is newer and is preserved. Local build/lint/typecheck results apply to the local installed dependencies. GitHub CI validates the remote lockfile independently.

## Protections reviewed

Server-only privileged database client; verified claims, application session eligibility and role checks; SQL row-level policies and restricted function grants; exact origin validation; database-backed rate limits; bounded request streams; contact challenge hostname/action validation; allowlisted redirect destinations; image decoding, pixel limits and WebP conversion; generic API errors and HttpOnly cookies. SQL source review does not establish that these migrations are applied in production.

## Changes

Added `npm run security:secrets`, scanner regression tests, checks in `npm run check`, and a GitHub Actions security workflow for pushes and pull requests. Expanded Git ignores for private key containers. The workflow takes effect only after these files reach GitHub.

## Key handling

Keep `.env.local` and private environment files out of commits; they are already ignored. Configure private credentials in hosting environment settings. Supabase publishable keys and Turnstile site keys are intentionally public; authorization must come from server checks and database RLS. Never place a secret or service-role key in a `NEXT_PUBLIC_` variable. The scanner rejects recognizable privileged keys configured there and reports paths/rules without printing values.

If a private credential was previously published, rotate it with its provider and update hosting secrets. Removing it from current files or adding an ignore rule does not revoke it or remove Git history. Remote history was unavailable for inspection; no credential exposure or rotation is claimed.

Remaining hardening opportunity: there is no Content-Security-Policy. Add one with tested nonces or hashes for the existing inline theme/motion bootstraps and allowances for Turnstile, then verify authentication and rendering in a browser. An untested blanket CSP could break these flows.

# Phase 4 — run the three live checkpoint demonstrations

Version 3.0.4 supplies `npm.cmd run checkpoint`. This is a browser-assisted acceptance runner, not proof that the three live demonstrations have already passed. Supabase and Vercel account access from the authoring chat is administrator-disabled, and no account passwords/cookies are available there. Google sign-in is user-confirmed; the remaining checkpoint results must come from the actual configured site.

## Install and deploy

Preserve your local `.env.local` and `package-lock.json`. Add the new `app/api/session/route.ts`, `scripts/checkpoint.mjs`, `scripts/checkpoint-core.ts`, `tests/checkpoint.test.ts` and updated `package.json`. Keep the updated integration test and documentation too. Deploy the new server route to the target Vercel project before running the command. The route returns only your own verified user ID and current database role, with no-store headers; it does not extend idle sessions or grant a role.

Run the existing local check with your installed dependencies:

```powershell
npm.cmd run check
```

No new npm dependencies or SQL migrations are required by this checkpoint update.

## Accounts and services needed

- Use the real bootstrapped **Owner** and a separate confirmed **Viewer**. The runner checks their current server-side roles before creating anything. It never promotes an account or creates a privileged test identity.
- Both accounts need email/password sign-in for the CLI. If an account currently has Google-only access, use the site's recovery flow to set its own password after Auth SMTP/recovery is configured. You can also use dedicated existing email/password test accounts with the correct roles. Do not paste passwords, cookies or keys into chat.
- Ensure the application's `/health` returns `{"status":"ok"}`. A healthy database does not by itself prove the private session RPC or permissions work.
- In the Owner's Settings, enable Owner email, sender confirmation and the notification badge. The runner reports contact as BLOCKED if they are off; it does not silently change preferences.
- Contact requires the deployed Turnstile site/secret keys and allowed hostname, valid Resend key/from address, privacy contact, and an email destination that Resend permits. Configure these in Vercel and redeploy if needed. Use real verification; no production CAPTCHA bypass is supplied.
- Use inboxes you control. You can use the same address for Owner and sender, but identify the two distinct email messages. A fresh contact uses one of the normal contact rate-limit slots. On a site with multiple Owners, the ordinary notification settings can send the test to multiple configured Owners.

## Run

From the project folder with Node.js 24:

```powershell
npm.cmd run checkpoint -- --url https://zelda-portfolio-tawny.vercel.app
```

The public target URL is explicit so the local setup's localhost value cannot accidentally select the wrong target. Owner/Viewer emails and passwords are entered in your own terminal and hidden, with history disabled. Optional existing `.env.integration` values provide local defaults. The runner never needs the Supabase secret key and never writes credentials to disk.

### 1. Viewer receives a real 403

The runner signs in both accounts through the application's real `/api/auth/login`, verifies their roles via `/api/session`, and creates one uniquely named **private draft** as Owner. It proves the Viewer can read it, attempts `DELETE` with the Viewer's cookies, requires HTTP **403**, then confirms the draft still exists. A 401, an Editor account, a missing record, or an unexpected successful deletion cannot count as a pass.

### 3. An Owner edit creates an audit entry

Using the same draft, it submits an edit with the original revision, reloads the entry to prove persistence, and requires an `update` audit event matching the project and authenticated Owner. It attempts to delete only this run's generated draft afterward. The audit entry remains for review. Cleanup failure is recorded and prevents an overall pass; forced process termination or a prolonged outage can require manual removal of the uniquely named fixture.

### 2. A real contact produces emails and a badge

The runner gives you an exact name, subject and message for one submission. Open the actual `/contact` page, enter your sender inbox locally, complete consent and Turnstile, and submit once. Watch the Owner dashboard badge before marking the message read.

Back in the terminal, confirm that the form accepted the submission. The runner locates this exact message in the Owner inbox and requires its matching unread notification and an increased unread count. It then asks you to check both actual inboxes and the visible badge. The sender receipt has this run's unique name in its greeting; the Owner email contains the unique subject.

**Email arrival and visible badge are explicitly recorded as operator observations.** A queued job, successful HTTP request, mocked test, or Resend API acceptance alone is not recorded as delivered mail. If an email has not arrived, answer no and inspect the real delivery/sender configuration; the report remains incomplete. Keep the test message unread while gathering evidence. Concurrent message reads can change the count; use a quiet test run.

The contact message/notification is retained for your live demonstration. It can be deleted afterward from the Owner inbox. The runner does not read private mailboxes, change roles/preferences, trigger a mail worker manually or bypass verification.

## Result and evidence

A redacted JSON report is saved in `checkpoint-reports/phase4-<run-id>.json`. That directory is gitignored. Reports contain result codes, public target URL, fixture/audit/message identifiers and the source of each observation. They exclude credentials, cookies, recipient emails and message contents. Attach only the report when asking for help.

Exit code zero requires all three checks to pass, verified distinct roles, successful draft cleanup and sign-out of the runner's sessions. FAIL and BLOCKED remain nonzero. `--automated-only` runs checks 1 and 3 but leaves check 2 BLOCKED and returns nonzero; it cannot certify the whole checkpoint.

The separate `npm.cmd run test:integration` suite now includes eight real HTTP cases: the earlier authorization/publication checks plus a real edit/audit check. Its real accounts are also role-verified. Missing test configuration fails rather than producing skipped success.

## Verification of the runner itself

83 unit/regression tests pass in the authoring environment, including eight checkpoint tests. These cover role confusion, 401 versus 403, actual fixture preservation, matching audit actor, revision conflicts, failed cleanup, cookie isolation/rotation, redirect refusal, report redaction and incomplete delivery evidence. They use test fixtures; they do not establish that any live checkpoint passed. A separate local HTTP/pseudo-terminal smoke completed the entire interactive command, checked hidden credentials and report redaction, and confirmed fixture cleanup; its contact/mail observations were simulated and its generated report was discarded. Full TypeScript, ESLint, Next build, deployed browser behavior and real email delivery still need execution with the installed application/services.

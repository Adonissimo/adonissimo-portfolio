// Runs from the user's computer. Passwords/cookies stay in memory; the saved
// report contains only explicitly selected result fields and fixture IDs.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { blocked, CheckpointFailure, contactEvidence, createApiClient, expectStatus, failure, isIdentifier, item, items, runApiChecks, siteOrigin } from './checkpoint-core.ts';

const local = name => fileURLToPath(new URL(`../${name}`, import.meta.url));
const args = process.argv.slice(2);
if (args.includes('--help')) {
  process.stdout.write('Adonissimo Phase 4 checkpoint\n\nRun: npm.cmd run checkpoint -- --url https://YOUR-SITE\n\nRequires a real Owner and a separate confirmed Viewer with email/password sign-in. Credentials are entered locally and hidden. Verifies server roles, Viewer DELETE 403, retained draft, persisted Owner edit and matching audit. Deletes only its generated draft. Guides one real browser contact submission, checks inbox/notification data and records your email/badge observations separately. The contact test message is kept for review. No provider keys, role promotion or Turnstile bypass is used.\n\nDeploy app/api/session/route.ts first. Google-only accounts need their own password set through account recovery for this CLI. Use --automated-only for checks 1 and 3; check 2 remains BLOCKED and exit is nonzero. Redacted reports are written to checkpoint-reports/.\n');
} else {
  void main().catch(() => { process.stderr.write('Checkpoint could not initialize. Check the project folder, Node.js 24, and file permissions. No credential values are printed.\n'); process.exitCode = 1; });
}

async function prompt(label, { secret = false, existing = '' } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new CheckpointFailure('interactive_terminal_required');
  return new Promise((resolve, reject) => {
    let muted = false; let completed = false;
    const output = new Writable({ write(chunk, encoding, done) { if (!muted) process.stdout.write(chunk, encoding); done(); } });
    const rl = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
    rl.once('SIGINT', () => { completed = true; muted = false; rl.close(); output.end(); reject(new CheckpointFailure('operator_cancelled')); });
    rl.once('close', () => { if (!completed) reject(new CheckpointFailure('input_closed')); });
    rl.question(`${label}${existing ? ' [Enter keeps existing]' : ''}${secret ? ' (hidden)' : ''}: `, answer => {
      completed = true; muted = false; rl.close(); output.end(); if (secret) process.stdout.write('\n'); resolve(answer || existing);
    });
    muted = secret;
  });
}
async function yes(label) {
  while (true) { const answer = (await prompt(`${label} [yes/no]`)).trim().toLowerCase(); if (answer === 'yes' || answer === 'y') return true; if (answer === 'no' || answer === 'n') return false; }
}
function defaults(name) { return existsSync(local(name)) ? parseEnv(readFileSync(local(name), 'utf8')) : {}; }
function address(value) {
  const result = value.trim().toLowerCase();
  if (result.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new CheckpointFailure('invalid_account_email');
  return result;
}

async function contact(request, origin, runId, ownerEmail) {
  const preferences = await request('/api/admin/settings', 'GET', 'OWNER');
  expectStatus(preferences, 200, 'owner_preferences_unavailable');
  const settings = item(preferences.data);
  if (![settings.owner_email, settings.sender_confirmation, settings.badge].every(value => value === true)) return blocked('enable_three_notification_preferences_in_owner_settings');
  const before = await request('/api/admin/notifications', 'GET', 'OWNER');
  expectStatus(before, 200, 'notification_baseline_unavailable');
  if (!before.data || !Number.isSafeInteger(before.data.unread) || before.data.badge !== true) throw new CheckpointFailure('invalid_notification_baseline');
  const senderEmail = address(await prompt('Sender confirmation inbox you control', { secret: true, existing: ownerEmail }));
  const name = `Checkpoint ${runId.slice(0, 8)}`;
  const subject = `Phase 4 contact ${runId}`;
  process.stdout.write(`\nOpen ${origin}/contact in your normal browser. Submit this single test through the real form:\n\nName: ${name}\nEmail: the sender inbox you just entered\nSubject: ${subject}\nMessage: This is the authorized portfolio checkpoint. Reference ${runId}.\n\nComplete consent and the real verification challenge. Also open ${origin}/admin as this Owner to watch the unread badge before marking the test message read. Baseline unread count: ${before.data.unread}.\n`);
  if (!await yes('Did the contact form confirm that the message was received?')) return blocked('contact_not_submitted');
  let stored;
  const deadline = Date.now() + 20000;
  while (!stored && Date.now() < deadline) {
    for (let page = 1; page <= 3 && !stored; page++) {
      const inbox = await request(`/api/admin/messages?page=${page}`, 'GET', 'OWNER');
      expectStatus(inbox, 200, 'owner_inbox_unavailable');
      stored = items(inbox.data).find(message => message.subject === subject && message.name === name && message.email === senderEmail && isIdentifier(message.id));
      if (items(inbox.data).length < 20) break;
    }
    if (!stored) await delay(1200);
  }
  if (!stored) throw new CheckpointFailure('submitted_contact_not_found_in_owner_inbox');
  const after = await request('/api/admin/notifications', 'GET', 'OWNER');
  expectStatus(after, 200, 'notification_result_unavailable');
  const notification = items(after.data).find(record => record.message_id === stored.id && record.read_at === null && isIdentifier(record.id));
  if (!notification || after.data?.badge !== true || !Number.isSafeInteger(after.data?.unread) || after.data.unread <= before.data.unread) throw new CheckpointFailure('new_unread_notification_not_confirmed');
  process.stdout.write(`\nThe saved test message has a matching unread notification. Unread count: ${before.data.unread} → ${after.data.unread}.\nCheck the actual inboxes now. Provider acceptance or a queued job alone does not prove email arrival.\nOwner subject: Portfolio letter: ${subject}\nSender subject: Your letter reached Adonissimo\nSender greeting: Hello ${name}\n`);
  const ownerObserved = await yes('Did the Owner email arrive with the exact test subject?');
  const senderObserved = await yes('Did the sender confirmation arrive with this run’s greeting?');
  const badgeObserved = await yes('Did you see the unread badge update in the Owner dashboard?');
  return contactEvidence({ messageId: stored.id, notificationId: notification.id, unreadBefore: before.data.unread, unreadAfter: after.data.unread, badgeEnabled: after.data.badge, ownerEmail: ownerObserved, senderEmail: senderObserved, badgeObserved });
}

async function main() {
  const runId = randomUUID();
  const report = { schemaVersion: 1, runId, startedAt: new Date().toISOString(), target: '', execution: 'not_started', setup: blocked(), rolesVerified: false, checks: { viewerDeletion: blocked(), contactDelivery: blocked(), auditEdit: blocked() }, cleanup: { fixture: blocked('no_fixture'), sessions: blocked() }, overall: 'BLOCKED', note: 'Checks 1 and 3 use real authenticated HTTP requests. Email arrival and visible badge are operator observations, not automated mailbox verification.' };
  const attempted = new Set(); let client;
  try {
    if (Number(process.versions.node.split('.')[0]) !== 24) throw new CheckpointFailure('node_24_required');
    if (!process.stdin.isTTY || !process.stdout.isTTY) throw new CheckpointFailure('interactive_terminal_required');
    let originArgument = '';
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--url' && args[index + 1]) originArgument = args[++index];
      else if (args[index] !== '--automated-only') throw new CheckpointFailure('unknown_checkpoint_argument');
    }
    const integration = defaults('.env.integration'); const configuration = defaults('.env.local');
    const origin = siteOrigin(originArgument || await prompt('Exact site origin to test', { existing: integration.BACKEND_TEST_URL || configuration.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' }));
    report.target = origin;
    process.stdout.write(`\nTesting ${origin}. This creates, edits and deletes one generated private draft. The browser-assisted contact step sends real test emails and keeps one test message for review. Account roles and notification preferences are not changed.\n`);
    client = createApiClient(origin);
    report.execution = 'preflight_only';
    const health = await client.request('/health');
    expectStatus(health, 200, 'database_health_unavailable');
    if (health.data?.status !== 'ok') throw new CheckpointFailure('database_health_unavailable');
    report.execution = 'live_http';
    let ownerEmail = '';
    for (const actor of ['OWNER', 'VIEWER']) {
      const email = address(await prompt(`${actor} test account email`, { secret: true, existing: integration[`TEST_${actor}_EMAIL`] || (actor === 'OWNER' ? configuration.OWNER_BOOTSTRAP_EMAIL : '') }));
      if (actor === 'OWNER') ownerEmail = email;
      else if (email === ownerEmail) throw new CheckpointFailure('distinct_test_accounts_required');
      const password = await prompt(`${actor} account password`, { secret: true, existing: integration[`TEST_${actor}_PASSWORD`] });
      if (!password || password.length > 128) throw new CheckpointFailure('invalid_account_password');
      attempted.add(actor);
      const login = await client.request('/api/auth/login', 'POST', actor, { email, password });
      expectStatus(login, 200, actor === 'OWNER' ? 'owner_sign_in_failed' : 'viewer_sign_in_failed');
    }
    report.setup = { status: 'PASS', reason: 'health_and_account_sign_in_succeeded', evidence: {} };
    const checks = await runApiChecks(client.request, runId);
    report.rolesVerified = checks.rolesVerified;
    report.checks.viewerDeletion = checks.viewerDeletion;
    report.checks.auditEdit = checks.auditEdit;
    report.cleanup.fixture = checks.cleanup;
    for (const [label, check] of [['1 · Viewer deletion', checks.viewerDeletion], ['3 · Edit audit', checks.auditEdit]]) process.stdout.write(`${label}: ${check.status} (${check.reason})\n`);
    if (checks.viewerDeletion.status === 'PASS' && checks.rolesVerified && !args.includes('--automated-only')) {
      try { report.checks.contactDelivery = await contact(client.request, origin, runId, ownerEmail); }
      catch (error) { report.checks.contactDelivery = failure(error); }
    } else report.checks.contactDelivery = blocked(args.includes('--automated-only') ? 'operator_contact_step_not_run' : 'fix_account_or_permission_test_first');
  } catch (error) { report.setup = failure(error); }
  finally {
    let logoutFailed = false;
    if (client) {
      for (const actor of attempted) {
        try { expectStatus(await client.request('/api/auth/logout', 'POST', actor, {}), 200, 'test_session_logout_failed'); }
        catch { logoutFailed = true; }
      }
      client.clear();
    }
    report.cleanup.sessions = { status: logoutFailed ? 'FAIL' : 'PASS', reason: logoutFailed ? 'one_or_more_test_sessions_need_sign_out' : attempted.size ? 'test_client_sessions_cleared' : 'no_test_sessions_opened', evidence: {} };
    const complete = report.setup.status === 'PASS' && report.rolesVerified && Object.values(report.checks).every(check => check.status === 'PASS') && report.cleanup.fixture.status === 'PASS' && !logoutFailed;
    report.overall = complete ? 'PASS' : 'INCOMPLETE';
    report.finishedAt = new Date().toISOString();
    mkdirSync(local('checkpoint-reports'), { recursive: true });
    const destination = local(`checkpoint-reports/phase4-${runId}.json`);
    writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    process.stdout.write(`\nCheckpoint results\n1 · Viewer DELETE 403: ${report.checks.viewerDeletion.status}\n2 · Contact emails and badge: ${report.checks.contactDelivery.status}\n3 · Audit after edit: ${report.checks.auditEdit.status}\nSetup: ${report.setup.status} (${report.setup.reason})\nOverall: ${report.overall}\nReport: ${destination}\n\nThe report excludes credentials, cookies, emails and message contents. A PASS combines real API evidence with your explicitly recorded email/badge observations. This run does not complete the other Phase 4 requirements.\n`);
    process.exitCode = complete ? 0 : 1;
  }
}

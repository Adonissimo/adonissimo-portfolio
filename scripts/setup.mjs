// Interactive local setup. Private values never travel through ChatGPT.
// Run with npm.cmd run setup on Windows; npm run setup on macOS/Linux.
import { existsSync, readFileSync, renameSync, writeFileSync, chmodSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { parseEnv } from 'node:util';
import { applicationSecrets, checkKey, mergeEnvironment, ownerAddress, projectAddress } from './setup-config.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = path => fileURLToPath(new URL(`../${path}`, import.meta.url));
const help = process.argv.includes('--help');
if (help) {
  process.stdout.write('Adonissimo local Supabase setup\n\nRun: npm.cmd run setup\n\nCollects project keys locally, generates missing app secrets, preserves other .env.local settings, runs install/check, opens Supabase CLI login, links the selected project, applies included migrations, and bootstraps Owner. The Owner password is passed in memory to the seed process, never written by setup.\n\nUse --configure-only to write local configuration without installing or changing the database. Supabase browser login and copying keys still require you. No Vercel deployment or mail/OAuth configuration is performed.\n');
} else {
  void main().catch(error => { process.stderr.write(`\n${error instanceof Error ? error.message : 'Setup stopped.'}\n`); process.exitCode = 1; });
}

async function prompt(label, { secret = false, existing = '' } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Open an interactive terminal to run setup. Private input is not accepted from redirected/piped input.');
  return new Promise((resolve, reject) => {
    let muted = false; let completed = false;
    const output = new Writable({ write(chunk, encoding, done) { if (!muted) process.stdout.write(chunk, encoding); done(); } });
    const rl = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
    const finish = answer => { completed = true; muted = false; rl.close(); output.end(); if (secret) process.stdout.write('\n'); resolve(answer || existing); };
    rl.once('SIGINT', () => { completed = true; muted = false; rl.close(); output.end(); reject(new Error('Setup cancelled.')); });
    rl.once('close', () => { if (!completed) reject(new Error('Input closed. Setup stopped.')); });
    rl.question(`${label}${existing ? ' [Enter keeps existing]' : ''}${secret ? ' (hidden)' : ''}: `, finish);
    muted = secret;
  });
}
async function validated(label, validate, options) {
  while (true) {
    const answer = await prompt(label, options);
    try { return validate(answer); }
    catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'Check the value and try again.'}\n`); }
  }
}
function run(args, env = {}) {
  const npm = process.env.npm_execpath;
  if (!npm || !existsSync(npm)) throw new Error('Start this wizard using npm.cmd run setup (npm run setup on macOS/Linux).');
  return new Promise((resolve, reject) => {
    // No shell: secret input never becomes command text or command-line arguments.
    const child = spawn(process.execPath, [npm, ...args], { cwd: root, stdio: 'inherit', shell: false, env: { ...process.env, ...env } });
    child.once('error', () => reject(new Error('A setup command could not start. Check Node/npm and retry.')));
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Setup stopped at a command with exit code ${code ?? 'unknown'}. Fix the reported error, then rerun npm.cmd run setup. Your saved configuration remains local.`)));
  });
}
async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Install/use Node.js 24 before running this setup.');
  if (!existsSync(local('supabase/migrations/202610300001_phase_four.sql')) || !existsSync(local('scripts/seed.mjs'))) throw new Error('Extract the complete Phase 4 archive before running setup.');
  process.stdout.write('Adonissimo — local Supabase setup\nKeys and passwords are entered on this computer, not in chat.\nThis links your selected Supabase project, applies the included migrations, and creates the initial Owner. Use your dedicated portfolio development project.\n\n');
  const file = local('.env.local'); const source = existsSync(file) ? readFileSync(file, 'utf8') : readFileSync(local('.env.example'), 'utf8');
  const existing = parseEnv(source);
  const address = await validated('Supabase Project URL', projectAddress, { existing: existing.NEXT_PUBLIC_SUPABASE_URL });
  const publishable = await validated('Supabase publishable key', value => checkKey(value, 'publishable'), { secret: true, existing: existing.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  const secret = await validated('Supabase secret key', value => checkKey(value, 'secret'), { secret: true, existing: existing.SUPABASE_SECRET_KEY });
  const email = await validated('Your Owner email', ownerAddress, { existing: existing.OWNER_BOOTSTRAP_EMAIL || existing.PRIVACY_CONTACT_EMAIL });
  const settings = { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: address.url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable, SUPABASE_SECRET_KEY: secret,
    ...applicationSecrets(existing), PRIVACY_CONTACT_EMAIL: existing.PRIVACY_CONTACT_EMAIL || email, OWNER_BOOTSTRAP_EMAIL: email };
  const next = mergeEnvironment(source, { ...settings, OWNER_BOOTSTRAP_PASSWORD: undefined });
  const temporary = local('.env.local.setup-tmp');
  try { writeFileSync(temporary, next, { mode: 0o600, flag: 'wx' }); renameSync(temporary, file); if (process.platform !== 'win32') chmodSync(file, 0o600); }
  catch { if (existsSync(temporary)) unlinkSync(temporary); throw new Error('Could not update .env.local. Check file permissions and close any conflicting editor save, then retry.'); }
  process.stdout.write(`\nLocal configuration saved. Target project: ${address.ref}\n`);
  if (process.argv.includes('--configure-only')) { process.stdout.write('Configuration-only mode complete. No packages, database migrations or Owner account were changed.\n'); return; }
  const password = await validated('Choose your Owner password', value => { if (value.length < 12 || value.length > 128) throw new Error('Use 12–128 characters.'); return value; }, { secret: true });
  while (true) { const confirm = await prompt('Repeat Owner password', { secret: true }); if (confirm === password) break; process.stderr.write('Passwords did not match. Try the confirmation again.\n'); }
  process.stdout.write('\nInstalling project dependencies…\n'); await run(['install']);
  process.stdout.write('\nChecking tests, TypeScript, lint and production build before database changes…\n'); await run(['run','check'], settings);
  const cli = ['exec','--yes','--package=supabase','--','supabase'];
  process.stdout.write('\nComplete the Supabase CLI sign-in in your own browser…\n'); await run([...cli,'login']);
  process.stdout.write('\nLinking the selected project…\n'); await run([...cli,'link','--project-ref',address.ref]);
  process.stdout.write('\nApplying the included migrations…\n'); await run([...cli,'db','push']);
  process.stdout.write('\nCreating the initial Owner and seed content…\n'); await run(['run','seed'], { ...settings, OWNER_BOOTSTRAP_PASSWORD: password });
  const health = await fetch(`${address.url}/rest/v1/rpc/healthcheck`, { method: 'POST', headers: { apikey: publishable, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) }).catch(() => null);
  if (!health?.ok || await health.json().catch(() => false) !== true) throw new Error('Setup commands completed, but the database health probe could not be confirmed. Check your project connection before using the app.');
  process.stdout.write('\nDatabase connection confirmed. Start the app with npm.cmd run dev, then open http://localhost:3000/login and sign in with your chosen Owner credentials.\n\nOAuth, Auth SMTP, contact verification/email delivery, scheduler, Vercel variables and live integration tests still need their documented setup. Read docs/PHASE_4.md.\n');
}

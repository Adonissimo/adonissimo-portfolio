import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = path => fileURLToPath(new URL(`../${path}`, import.meta.url));
const tests = readdirSync(local('tests')).filter(name => name.endsWith('.test.ts')).sort().map(name => `tests/${name}`);
const checks = [
  { name: 'Secret exposure', args: ['scripts/check-secrets.mjs'] },
  { name: 'Secret scanner tests', args: ['--test', 'tests/secrets.test.mjs'] },
  { name: 'Tests', args: ['--experimental-strip-types', '--test', ...tests] },
  { name: 'TypeScript', file: 'node_modules/typescript/bin/tsc', args: ['--noEmit'] },
  { name: 'ESLint', file: 'node_modules/eslint/bin/eslint.js', before: 'scripts/check-lint-tooling.mjs', args: ['.', '--max-warnings=0'] },
  { name: 'Production build', file: 'node_modules/next/dist/bin/next', args: ['build'] }
];
const results = [];
for (const check of checks) {
  process.stdout.write(`\n${check.name}\n`);
  if (check.file && !existsSync(local(check.file))) {
    process.stderr.write('Dependencies are missing. Run npm install (npm.cmd install in PowerShell), then run check again.\n');
    results.push({ name: check.name, status: 'BLOCKED' });
    continue;
  }
  if (check.before) {
    const before = spawnSync(process.execPath, [local(check.before)], { cwd: root, stdio: 'inherit' });
    if (before.error) process.stderr.write(`${before.error.message}\n`);
    if (before.status !== 0 || before.error) {
      results.push({ name: check.name, status: 'FAIL' });
      continue;
    }
  }
  const args = check.file ? [local(check.file), ...check.args] : check.args;
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  results.push({ name: check.name, status: result.status === 0 && !result.error ? 'PASS' : 'FAIL' });
}
process.stdout.write('\nVerification results\n');
for (const result of results) process.stdout.write(`${result.status}: ${result.name}\n`);
process.exitCode = results.every(result => result.status === 'PASS') ? 0 : 1;

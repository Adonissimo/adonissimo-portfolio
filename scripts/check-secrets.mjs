import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// Diagnostics deliberately contain paths and rule names, never matched values.
export function secretRules(source) {
  const rules = [];
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) rules.push('private key');
  if (/\bsb_secret_[A-Za-z0-9_-]{20,}/.test(source)) rules.push('Supabase secret');
  if (/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/.test(source)) rules.push('GitHub token');
  if (/\bAKIA[A-Z0-9]{16}\b/.test(source)) rules.push('AWS access key');
  for (const token of source.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
    try {
      if (JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role === 'service_role') rules.push('privileged Supabase JWT');
    } catch { /* Not a decodable JWT. */ }
  }
  return [...new Set(rules)];
}

export function scanSecrets(root) {
  const findings = [];
  const known = [];
  // Compare local private values too, including providers without a recognizable prefix.
  for (const name of readdirSync(root).filter(name => /^\.env(?:\.|$)/.test(name) && !name.endsWith('.example'))) {
    for (const line of readFileSync(resolve(root, name), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      if (match[1].startsWith('NEXT_PUBLIC_')) {
        if (secretRules(match[2]).length || /(?:SECRET|PASSWORD|PRIVATE_KEY|SERVICE_ROLE)/.test(match[1])) findings.push({ path: name, rule: 'private credential configured as public environment variable' });
        continue;
      }
      if (!/(?:SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE_KEY)/.test(match[1])) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      if (value.length >= 8) known.push(value);
    }
  }
  const skip = new Set(['node_modules', '.git', '.next', '.vercel', '.vs', 'checkpoint-reports']);
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.isSymbolicLink()) continue;
      const path = resolve(dir, item.name);
      if (item.isDirectory()) { if (!skip.has(item.name)) walk(path); continue; }
      if (/^\.env(?:\.|$)/.test(item.name) && !item.name.endsWith('.example')) continue;
      const bytes = readFileSync(path);
      if (bytes.includes(0)) continue;
      const source = bytes.toString('utf8');
      for (const rule of secretRules(source)) findings.push({ path: relative(root, path), rule });
      if (known.some(value => source.includes(value))) findings.push({ path: relative(root, path), rule: 'local private value' });
    }
  }
  walk(root);
  // Browser bundles are deployable artifacts; server bundles legitimately access secrets.
  if (existsSync(resolve(root, '.next/static'))) walk(resolve(root, '.next/static'));
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const findings = scanSecrets(root);
  for (const finding of findings) console.error(`${finding.path}: ${finding.rule}`);
  console.log(findings.length ? `FAIL: ${findings.length} possible secret leaks.` : `PASS: no recognized private keys or local private values in ${basename(root)} source/public assets/browser bundles.`);
  process.exitCode = findings.length ? 1 : 0;
}

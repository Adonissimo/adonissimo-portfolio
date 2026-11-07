import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';

export function projectAddress(value: string): { url: string; ref: string } {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Paste the Project URL from the Supabase Connect dialog.'); }
  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
  if (url.protocol !== 'https:' || !match || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/') throw new Error('Use the canonical HTTPS Project URL ending in .supabase.co.');
  return { url: url.origin, ref: match[1] };
}
export function checkKey(value: string, kind: 'publishable' | 'secret'): string {
  const key = value.trim();
  // New-format keys only: avoids confusing publishable/secret and legacy roles.
  if (!new RegExp(`^sb_${kind}_[A-Za-z0-9_-]{16,}$`).test(key)) throw new Error(`Copy the ${kind} key from Supabase Settings → API Keys.`);
  return key;
}
export function ownerAddress(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>"\\]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(email)) throw new Error('Enter your own valid email address.');
  return email;
}
export function applicationSecrets(existing: Record<string,string>): { RATE_LIMIT_SECRET: string; JOBS_SECRET: string } {
  const rate = existing.RATE_LIMIT_SECRET?.length >= 32 ? existing.RATE_LIMIT_SECRET : randomBytes(32).toString('hex');
  const jobs = existing.JOBS_SECRET?.length >= 32 && existing.JOBS_SECRET !== rate ? existing.JOBS_SECRET : randomBytes(32).toString('hex');
  return { RATE_LIMIT_SECRET: rate, JOBS_SECRET: jobs };
}
export function mergeEnvironment(source: string, updates: Record<string, string | undefined>): string {
  const parsed = parseEnv(source); const newline = source.includes('\r\n') ? '\r\n' : '\n';
  let lines = source.split(/\r?\n/);
  for (const [key,value] of Object.entries(updates)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) throw new Error('Invalid environment variable name.');
    if (parsed[key]?.includes('\n') || parsed[key]?.includes('\r')) throw new Error(`Remove the multiline ${key} entry before using setup.`);
    if (value !== undefined && /["\r\n\u0000]/.test(value)) throw new Error(`The ${key} value cannot contain a double quote or line break.`);
    const pattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`);
    let found = false;
    lines = lines.flatMap(line => {
      if (!pattern.test(line)) return [line];
      if (found || value === undefined) return [];
      found = true; return [`${key}="${value}"`];
    });
    if (!found && value !== undefined) { while (lines.at(-1) === '') lines.pop(); lines.push(`${key}="${value}"`); }
  }
  return lines.join(newline).replace(/(?:\r?\n)*$/, newline);
}

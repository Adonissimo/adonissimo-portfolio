import { safeHttps, emailHref } from '../content.ts';

export const roles = ['owner', 'editor', 'viewer'] as const;
export type Role = typeof roles[number];
export type Collection = 'projects' | 'posts';
export type Permission = 'read' | 'write' | 'delete' | 'manage';
export type MessageStatus = 'unread' | 'read' | 'archived' | 'spam';
export type CmsEntry = {
  id: string; title: string; slug: string; description: string; body: string;
  published: boolean; tags: string[]; stage: 'built' | 'planned';
  live_url: string | null; source_url: string | null; image_id: string | null;
  created_at?: string; updated_at?: string;
};
export type ContactInput = { name: string; email: string; subject: string; body: string; consent: true; token: string; submissionId: string };
export class AppError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string>;
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message); this.name = 'AppError'; this.status = status; this.fields = fields;
  }
}
export function isRole(value: unknown): value is Role { return roles.some(role => role === value); }
export function permitted(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return permission === 'read' || role === 'owner' || (role === 'editor' && permission === 'write');
}
export function authorize(role: Role | null, permission: Permission): void {
  if (!role) throw new AppError(401, 'Sign in to continue.');
  if (!permitted(role, permission)) throw new AppError(403, 'Your role does not allow this action.');
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(400, 'Send a valid JSON object.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, name: string, min: number, max: number): string {
  const result = typeof value === 'string' ? value.trim() : '';
  if (result.length < min || result.length > max || result.includes('\u0000')) throw new AppError(422, `Check ${name}.`, { [name]: `Use ${min}–${max} characters.` });
  return result;
}
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new AppError(400, 'Invalid record identifier.');
  return value;
}
export function email(value: unknown): string {
  const result = text(value, 'email', 3, 254).toLowerCase();
  if (!emailHref(result) || !/^[^\s@<>]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(result) || [...result].some(char => char.charCodeAt(0) < 33)) throw new AppError(422, 'Enter a valid email address.', { email: 'Enter a valid email address.' });
  return result;
}
export function password(value: unknown): string {
  // Preserve intentional spaces in passwords; never trim credentials.
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new AppError(422, 'Use a password of 12–128 characters.', { password: 'Use a password of 12–128 characters.' });
  return value;
}
export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 12) throw new AppError(422, 'Choose at most 12 tags.');
  return [...new Set(value.map(tag => text(tag, 'tag', 1, 40)))];
}
export function validateEntry(value: unknown, id?: string): CmsEntry {
  const input = object(value);
  const slug = text(input.slug, 'slug', 1, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new AppError(422, 'Use lowercase words separated by hyphens.', { slug: 'Use lowercase words separated by hyphens.' });
  if (typeof input.published !== 'boolean') throw new AppError(422, 'Choose Draft or Published.');
  const url = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const valid = typeof value === 'string' && value.length <= 2048 ? safeHttps(value) : undefined;
    if (!valid) throw new AppError(422, 'Project links must use HTTPS without credentials.');
    return valid;
  };
  const stage = input.stage ?? 'built';
  if (stage !== 'built' && stage !== 'planned') throw new AppError(422, 'Choose a valid project stage.');
  if (id && (typeof input.updated_at !== 'string' || !Number.isFinite(Date.parse(input.updated_at)))) throw new AppError(422, 'Reload this entry before editing it.');
  return { id: id ? uuid(id) : '', title: text(input.title, 'title', 2, 120), slug,
    description: text(input.description, 'description', 10, 500), body: text(input.body, 'body', 10, 30000),
    published: input.published, tags: normalizeTags(input.tags ?? []), stage, ...(id ? { updated_at: input.updated_at as string } : {}),
    live_url: url(input.live_url), source_url: url(input.source_url), image_id: input.image_id ? uuid(input.image_id) : null };
}
export function validateContact(value: unknown): ContactInput {
  const input = object(value);
  if (input.consent !== true) throw new AppError(422, 'Please agree to the privacy notice.', { consent: 'Please agree to the privacy notice.' });
  return { name: text(input.name, 'name', 2, 80), email: email(input.email), subject: text(input.subject, 'subject', 3, 120), body: text(input.body, 'body', 10, 4000), consent: true, token: text(input.token, 'verification', 1, 2048), submissionId: uuid(input.submissionId) };
}
export function pageQuery(params: URLSearchParams) {
  const positive = (name: string, fallback: number, max: number) => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw new AppError(400, `Invalid ${name}.`);
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new AppError(400, `Invalid ${name}.`);
    return value;
  };
  return { page: positive('page', 1, 10000), limit: positive('limit', 12, 50), query: (params.get('q') ?? '').slice(0, 120), tag: (params.get('tag') ?? '').slice(0, 40) };
}
export function localDestination(value: unknown): string { return value === '/reset-password' ? '/reset-password' : '/admin'; }

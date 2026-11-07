import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { backendConfigured } from './config';
import { publicDb } from './db';
import { AppError, pageQuery, type CmsEntry, type Collection } from './domain';
import { dbFailure } from './http';
import { projects as fallbackProjects, type Project } from '../content';

export type JoinedEntry = Omit<CmsEntry, 'tags'> & { project_tags?: { tags: { name: string } | null }[]; post_tags?: { tags: { name: string } | null }[] };
export function normalizeEntry(item: JoinedEntry): CmsEntry {
  return { ...item, tags: (item.project_tags ?? item.post_tags ?? []).flatMap(join => join.tags ? [join.tags.name] : []) };
}
export const selectEntry = (kind: Collection) => `*,${kind === 'projects' ? 'project_tags' : 'post_tags'}(tags(name))`;
export async function listEntries(db: SupabaseClient, kind: Collection, params: URLSearchParams, publishedOnly: boolean) {
  const { page, limit, query, tag } = pageQuery(params);
  // Use an INNER tag relationship only when filtering; search uses a bound ILIKE value.
  const relation = kind === 'projects' ? 'project_tags' : 'post_tags';
  const selection = tag ? `*,${relation}!inner(tags!inner(name))` : selectEntry(kind);
  let select = db.from(kind).select(selection, { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false });
  if (publishedOnly) select = select.eq('published', true);
  if (query) select = select.ilike('title', `%${query.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`);
  if (tag) select = select.eq(`${relation}.tags.name`, tag);
  const { data, error, count } = await select.range((page - 1) * limit, page * limit - 1).returns<JoinedEntry[]>();
  dbFailure(error);
  return { items: (data ?? []).map(normalizeEntry), total: count ?? 0, page, limit };
}
export async function publishedEntry(kind: Collection, slug: string) {
  if (!backendConfigured()) return null;
  const { data, error } = await publicDb().from(kind).select(selectEntry(kind)).eq('published', true).eq('slug', slug).maybeSingle<JoinedEntry>();
  dbFailure(error);
  return data ? normalizeEntry(data) : null;
}
export async function publishedEntries(kind: Collection, limit = 50): Promise<CmsEntry[]> {
  if (!backendConfigured()) return [];
  return (await listEntries(publicDb(), kind, new URLSearchParams({ limit: String(limit) }), true)).items;
}
export function toProject(entry: CmsEntry): Project {
  return { slug: entry.slug, title: entry.title, description: entry.description, status: entry.stage, art: 'sword', tags: entry.tags,
    year: entry.created_at?.slice(0,4) ?? '2026', stage: entry.stage === 'planned' ? 'Planned' : 'Built',
    overview: entry.description, challenge: '', approach: [], outcome: '', liveUrl: entry.live_url ?? undefined, sourceUrl: entry.source_url ?? undefined };
}
export async function homeProjects(): Promise<readonly Project[]> {
  if (!backendConfigured()) return fallbackProjects;
  return (await publishedEntries('projects', 6)).map(toProject);
}
export function mustFind<T>(value: T | null | undefined): T { if (!value) throw new AppError(404, 'The record was not found.'); return value; }

'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { CmsEntry, Collection } from '@/lib/backend/domain';
import { api } from '@/lib/client-api';
import { RealmScene } from './realm-scene';
import { CollectionSkeleton } from './loading-state';
import { CinematicLink as Link } from './cinematic-link';
type Result = { items: CmsEntry[]; total: number; page: number; limit: number };
export function ContentBrowser({ kind, initial, tags }: { kind: Collection; initial: Result; tags: string[] }) {
  const [data, setData] = useState(initial); const [query, setQuery] = useState(''); const [tag, setTag] = useState('');
  const [pending, setPending] = useState(false); const [error, setError] = useState(''); const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function load(page: number, nextTag = tag, nextQuery = query) {
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    setPending(true); setError('');
    try { const result = await api<Result>(`/api/content/${kind}?${new URLSearchParams({ page: String(page), limit: '6', q: nextQuery, tag: nextTag })}`, { signal: controller.signal }); if (active.current === controller && !controller.signal.aborted) setData(result); }
    catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The entries could not load.'); }
    finally { if (active.current === controller && !controller.signal.aborted) { setPending(false); active.current = null; } }
  }
  const pages = Math.max(1, Math.ceil(data.total / data.limit)); const base = kind === 'posts' ? '/blog' : '/projects';
  return <>
    <form className="filter-bar cms-filter-bar" onSubmit={event => { event.preventDefault(); void load(1); }}><label>Search {kind === 'posts' ? 'field notes' : 'quests'}<input type="search" value={query} maxLength={120} onChange={event => setQuery(event.target.value)}/></label><label>Tag<select value={tag} onChange={event => { setTag(event.target.value); void load(1, event.target.value); }}><option value="">All tags</option>{tags.map(value => <option key={value}>{value}</option>)}</select></label><button className="button" disabled={pending}>Search</button></form>
    <p className="collection-status" role="status" data-pending={pending ? 'true' : undefined}>{pending ? (data.items.length ? 'Updating entries… Showing previous results.' : 'Loading entries…') : `${data.total} ${data.total === 1 ? 'entry' : 'entries'} found`}</p>
    {error && <div role="alert" className="preview-note">{error}<button onClick={() => void load(data.page)}>Retry</button></div>}
    <div className={kind === 'projects' ? 'browse-projects' : 'article-index'} aria-busy={pending}>
      {pending && !data.items.length ? <CollectionSkeleton kind={kind} count={data.limit}/> : data.items.map(item => <article className={kind === 'projects' ? 'browse-entry' : undefined} key={item.id}>
        {kind === 'projects' && (item.image_id ? <Image className="project-art" src={`/media/${item.image_id}`} alt="" width={800} height={500} unoptimized/> : <RealmScene realm="zonai"/>)}
        <div><h2><Link href={`${base}/${item.slug}`}>{item.title}</Link></h2><p>{item.description}</p><p className="tag-line">{item.tags.join(' · ')}</p><Link className="quiet-link" href={`${base}/${item.slug}`}>Read this entry</Link></div>
      </article>)}
    </div>
    {!pending && !data.items.length && <div className="empty-state"><h2>No entries match.</h2><p>Try another tag or search term.</p><button onClick={() => { setQuery(''); setTag(''); void load(1, '', ''); }}>Clear filters</button></div>}
    <nav className="pagination" aria-label="Journal pages"><button disabled={pending || data.page <= 1} onClick={() => void load(data.page-1)}>Previous</button><span>Page {data.page} of {pages}</span><button disabled={pending || data.page >= pages} onClick={() => void load(data.page+1)}>Next</button></nav>
  </>;
}

import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ContentBrowser } from '@/components/content-browser';
import { demoPosts } from '@/lib/phase-three';
import { CinematicLink as Link } from '@/components/cinematic-link';
import { backendConfigured } from '@/lib/backend/config';
import { publicDb } from '@/lib/backend/db';
import { listEntries } from '@/lib/backend/content';
import { dbFailure } from '@/lib/backend/http';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Field notes' };
export default async function Page() {
  if (backendConfigured()) {
    const db = publicDb();
    const initial = await listEntries(db, 'posts', new URLSearchParams({ limit: '6' }), true);
    const tags = await db.from('tags').select('name').order('name').limit(200); dbFailure(tags.error);
    return <main id="main" data-realm="depths" className="chapter-page page-shell"><PageHeading realm="depths" title="Field notes." description="Ideas and lessons from along the path."/><ContentBrowser kind="posts" initial={initial} tags={(tags.data ?? []).map(item => String(item.name))}/></main>;
  }
  return <main id="main" data-realm="depths" className="chapter-page page-shell"><PageHeading realm="depths" title="Field notes." description="Ideas and lessons from along the path."/><p className="preview-note">Sample articles shown while the journal service is being connected.</p><div className="article-index">{demoPosts.filter(post=>post.published).map(post=><article key={post.slug}><span>Sample article · {post.tags}</span><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.description}</p><Link className="quiet-link" href={`/blog/${post.slug}`}>Read this entry</Link></article>)}</div></main>;
}

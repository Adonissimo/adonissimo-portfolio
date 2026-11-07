import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ProjectBrowser } from '@/components/project-browser';
import { ContentBrowser } from '@/components/content-browser';
import { backendConfigured } from '@/lib/backend/config';
import { publicDb } from '@/lib/backend/db';
import { listEntries } from '@/lib/backend/content';
import { dbFailure } from '@/lib/backend/http';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'The adventure log.' };
export default async function Page() {
 const live = backendConfigured();
 const db = live ? publicDb() : null;
 const initial = db ? await listEntries(db, 'projects', new URLSearchParams({ limit: '6' }), true) : null;
 const tags = db ? await db.from('tags').select('name').order('name').limit(200) : null;
 if (tags) dbFailure(tags.error);
 return <main id="main" data-realm="zonai" className="chapter-page page-shell"><PageHeading realm="zonai" title={'The adventure log.'} description={'Projects, experiments, and paths still unexplored.'}/>{initial ? <ContentBrowser kind="projects" initial={initial} tags={(tags?.data ?? []).map(item => String(item.name))}/> : <ProjectBrowser/>}</main>; }

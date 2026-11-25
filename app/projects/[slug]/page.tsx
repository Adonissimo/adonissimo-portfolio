import { CinematicLink as Link } from '@/components/cinematic-link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProject, safeHttps } from '@/lib/content';
import { getSiteUrl } from '@/lib/site';
import { RealmScene } from '@/components/realm-scene';
import { WorldDivider } from '@/components/world-divider';
import { Icon } from '@/components/icons';
import { backendConfigured } from '@/lib/backend/config';
import { publishedEntry } from '@/lib/backend/content';
import { CmsDetail } from '@/components/cms-detail';
import { ZeldaBonkShowcase } from '@/components/zeldabonk-showcase';

type Props = { params: Promise<{ slug: string }> };
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = backendConfigured() ? await publishedEntry('projects', slug) : getProject(slug);
  if (!project) return { title: 'Quest not found' };
  return { title: project.title, description: project.description, ...(getSiteUrl() ? { alternates: { canonical: `/projects/${project.slug}` } } : {}) };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (backendConfigured()) { const entry = await publishedEntry('projects', slug); if (!entry) notFound(); return <CmsDetail entry={entry} kind="projects"/>; }
  const project = getProject(slug);
  if (!project) notFound();
  const live = safeHttps(project.liveUrl);
  const source = safeHttps(project.sourceUrl);
  return <main data-realm="zonai" className="case-study page-shell" id="main"><Link href="/#projects" className="quiet-link back-link"><span aria-hidden="true">←</span> Back to the adventure log</Link><div className="case-heading"><div><h1>{project.title}</h1><p>{project.description}</p><div className="case-tags flex flex-wrap gap-2">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="case-art"><RealmScene realm="zonai"/></div></div><dl className="case-meta"><div><dt>Quest type</dt><dd>Personal project</dd></div><div><dt>Year</dt><dd>{project.year}</dd></div><div><dt>Status</dt><dd>{project.stage}</dd></div></dl><WorldDivider realm="zonai"/><div className="case-body">{project.slug === 'zeldabonk' && <ZeldaBonkShowcase liveUrl={project.liveUrl}/>}<section aria-labelledby="overview"><h2 id="overview">The quest</h2><p>{project.overview}</p></section><section aria-labelledby="challenge"><h2 id="challenge">The puzzle</h2><p>{project.challenge}</p></section><section aria-labelledby="approach"><h2 id="approach">The path I took</h2><ul>{project.approach.map(step => <li key={step}>{step}</li>)}</ul></section><section aria-labelledby="outcome"><h2 id="outcome">Where it stands</h2><p>{project.outcome}</p></section>{(live || source) && <div className="case-actions">{live && <a className="button" href={live} target="_blank" rel="noopener noreferrer">Visit the project <Icon name="external"/></a>}{source && <a className="quiet-link" href={source} target="_blank" rel="noopener noreferrer">View source <Icon name="diagonal"/></a>}</div>}<Link className="button case-return" href="/#projects">Return to the journal <Icon name="arrow"/></Link></div></main>;
}

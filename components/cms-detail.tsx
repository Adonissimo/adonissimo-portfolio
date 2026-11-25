import Image from 'next/image';
import type { CmsEntry } from '@/lib/backend/domain';
import { Markdown } from './markdown';
import { RealmScene } from './realm-scene';
import { WorldDivider } from './world-divider';
import { CinematicLink as Link } from './cinematic-link';
import { ZeldaBonkShowcase } from './zeldabonk-showcase';
export function CmsDetail({ entry, kind }: { entry: CmsEntry; kind: 'projects' | 'posts' }) {
  const base = kind === 'posts' ? '/blog' : '/projects';
  const isZeldaBonk = kind === 'projects' && entry.slug === 'zeldabonk';
  return <main id="main" data-realm={kind === 'posts' ? 'depths' : 'zonai'} className="chapter-page page-shell reading-page"><Link className="quiet-link" href={base}>Back to {kind === 'posts' ? 'field notes' : 'the adventure log'}</Link><h1>{entry.title}</h1><p>{entry.description}</p><p className="tag-line">{entry.tags.join(' · ')}</p>{entry.image_id && <Image className="cms-cover" src={`/media/${entry.image_id}`} alt="" width={1600} height={1000} unoptimized/>}{isZeldaBonk && <ZeldaBonkShowcase liveUrl={entry.live_url}/>} {!entry.image_id && !isZeldaBonk && <RealmScene realm={kind === 'posts' ? 'depths' : 'zonai'} className="reading-vista"/>}<WorldDivider realm={kind === 'posts' ? 'depths' : 'zonai'}/><Markdown source={entry.body}/><div className="desk-actions">{entry.live_url && <a className="button" href={entry.live_url} target="_blank" rel="noopener noreferrer">Visit project</a>}{entry.source_url && <a className="quiet-link" href={entry.source_url} target="_blank" rel="noopener noreferrer">View source</a>}</div><Link className="quiet-link" href={base}>Return to the journal</Link></main>;
}

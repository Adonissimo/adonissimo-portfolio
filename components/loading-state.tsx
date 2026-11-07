import { PageHeading } from './page-heading';

export function CollectionSkeleton({ kind, count = 3 }: { kind: 'projects' | 'posts'; count?: number }) {
  const rows = Math.max(1, Math.min(6, Math.floor(count) || 3));
  return <div className="collection-skeleton" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => <div key={index} className={kind === 'projects' ? 'skeleton-project' : 'skeleton-post'}>
      {kind === 'projects' && <span className="skeleton-block skeleton-image"/>}
      <div><span className="skeleton-block skeleton-heading"/><span className="skeleton-block skeleton-line"/><span className="skeleton-block skeleton-line skeleton-line-short"/><span className="skeleton-block skeleton-link"/></div>
    </div>)}
  </div>;
}

export function JournalLoading({ kind }: { kind: 'projects' | 'posts' }) {
  const posts = kind === 'posts';
  return <main id="main" className="chapter-page page-shell" data-realm={posts ? 'depths' : 'zonai'}>
    <PageHeading realm={posts ? 'depths' : 'zonai'} title={posts ? 'Field notes.' : 'The adventure log.'} description={posts ? 'Ideas and lessons from along the path.' : 'Projects, experiments, and paths still unexplored.'}/>
    <div className="skeleton-toolbar" aria-hidden="true"><span className="skeleton-block skeleton-input"/><span className="skeleton-block skeleton-input"/><span className="skeleton-block skeleton-button"/></div>
    <p role="status">{posts ? 'Loading field notes…' : 'Loading projects…'}</p>
    <div aria-busy="true"><CollectionSkeleton kind={kind}/></div>
  </main>;
}

export function DashboardSkeleton() {
  return <div className="skeleton-table" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <span className="skeleton-block skeleton-line" key={index}/>)}</div>;
}

export function HomeProjectsSkeleton() {
  return <div className="home-projects-loading">
    <div className="journal-controls skeleton-journal-controls"><span className="skeleton-block skeleton-filter-tabs" aria-hidden="true"/><span className="journal-result" role="status">Loading projects…</span></div>
    <div className="project-list project-preview" data-entry-count="1" aria-busy="true">
      <div className="quest-entry" aria-hidden="true"><div className="quest-image skeleton-block"/><div className="quest-content"><span className="skeleton-block skeleton-heading"/><span className="skeleton-block skeleton-line"/><span className="skeleton-block skeleton-line skeleton-line-short"/><span className="skeleton-block skeleton-link"/></div></div>
    </div>
  </div>;
}

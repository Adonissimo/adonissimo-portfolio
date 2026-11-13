'use client';

import { CinematicLink as Link } from './cinematic-link';
import { flushSync } from 'react-dom';
import { changeView } from '@/lib/motion';
import { useState } from 'react';
import { filterProjects, type Project, type ProjectFilter } from '@/lib/content';
import { RealmScene } from './realm-scene';
import { Icon } from './icons';

const tabs = [
  { id: 'all', label: 'All projects' },
  { id: 'built', label: 'Built projects' },
  { id: 'planned', label: 'Planned' }
] as const;

export function ProjectJournal({ projects, limit, initialFilter = 'all' }: { projects: readonly Project[]; limit?: number; initialFilter?: ProjectFilter }) {
  const [filter, setFilter] = useState<ProjectFilter>(initialFilter);
  const filtered = filterProjects(projects, filter);
  const visible = limit ? filtered.slice(0, limit) : filtered;
  return <>
    <div className="journal-controls js-only">
      <div className="journal-filters" role="group" aria-label="Filter projects">
        {tabs.map(tab => <button key={tab.id} type="button" data-sfx="filter" aria-pressed={filter === tab.id} onClick={() => { if (filter !== tab.id) changeView(() => flushSync(() => setFilter(tab.id)), 'journal'); }}>{tab.label}<span>{filterProjects(projects, tab.id).length}</span></button>)}
      </div>
      <span className="journal-result" role="status" aria-live="polite" aria-atomic="true">{visible.length < filtered.length ? `${visible.length} of ` : ''}{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
    </div>
    <div className={`project-list${limit ? ' project-preview' : ''}`} key={filter} data-journal-filter={filter} data-entry-count={visible.length}>
      {visible.map(project => <article key={project.slug} className={`quest-entry ${project.status === 'planned' ? 'is-planned' : ''}`}>
        <div className="quest-image"><RealmScene realm={project.status === 'built' ? 'zonai' : project.art === 'map' ? 'fields' : 'sky'}/><span className="quest-state">{project.status === 'built' ? 'Built project' : 'Planned'}</span></div>
        <div className="quest-content"><div className="quest-tags">{project.tags.join(' / ')}</div><h3>{project.status === 'built' ? <Link href={`/projects/${project.slug}`}>{project.title}</Link> : project.title}</h3><p>{project.description}</p>{project.status === 'built' ? <Link className="quest-link" href={`/projects/${project.slug}`}>Read case study <Icon name="diagonal"/></Link> : <span className="quest-pending"><Icon name={project.art === 'map' ? 'map' : 'leaf'}/> Reserved for what comes next</span>}</div>
      </article>)}
      {!filtered.length && <div className="empty-state"><Icon name="map"/><h3>No projects here yet.</h3><p>Try another filter to explore the journal.</p><button className="button" onClick={() => setFilter('all')}>Show all projects</button></div>}
    </div>
  </>;
}

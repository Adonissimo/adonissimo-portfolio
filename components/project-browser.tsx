'use client';
import { useState } from 'react';
import { projects } from '@/lib/content';
import { RealmScene } from './realm-scene';
import { CinematicLink as Link } from './cinematic-link';
export function ProjectBrowser() {
 const [tag,setTag]=useState('All'); const [page,setPage]=useState(1); const [query,setQuery]=useState('');
 const tags=['All',...new Set(projects.flatMap(item=>item.tags))];
 const found=projects.filter(item=>(tag==='All'||item.tags.includes(tag)) && `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
 const pages=Math.max(1,Math.ceil(found.length/2)); const current=Math.min(page,pages);
 return <><div className="filter-bar"><label>Search quests<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><label>Technology<select value={tag} onChange={e=>{setTag(e.target.value);setPage(1);}}>{tags.map(value=><option key={value}>{value}</option>)}</select></label></div><p role="status">{found.length} {found.length===1?'quest':'quests'} found</p><div className="browse-projects">{found.slice((current-1)*2,current*2).map(project=><article className="browse-entry" key={project.slug}><RealmScene realm={project.status === 'built' ? 'zonai' : project.art === 'map' ? 'fields' : 'sky'}/><div><span>{project.status==='planned'?'Future project slot':project.stage}</span><h2>{project.title}</h2><p>{project.description}</p><p className="tag-line">{project.tags.join(' · ')}</p>{project.status==='built'&&<Link className="quiet-link" href={`/projects/${project.slug}`}>Read the quest log</Link>}</div></article>)}</div>{!found.length&&<div className="empty-state"><h2>No quests match.</h2><p>Try another technology or search term.</p><button onClick={()=>{setTag('All');setQuery('');setPage(1);}}>Clear filters</button></div>}<nav className="pagination" aria-label="Project pages"><button disabled={current===1} data-sfx="page-back" onClick={()=>setPage(current-1)}>Previous</button><span aria-live="polite">Page {current} of {pages}</span><button disabled={current===pages} data-sfx="page" onClick={()=>setPage(current+1)}>Next</button></nav></>;
}

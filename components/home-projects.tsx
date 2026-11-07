import { homeProjects } from '@/lib/backend/content';
import { ProjectJournal } from './project-journal';

/** Only the live project section waits for data; the rest of Home can stream. */
export async function HomeProjects() {
  const projects = await homeProjects();
  return <ProjectJournal projects={projects} limit={3} initialFilter={projects.some(project => project.status === 'built') ? 'built' : 'all'}/>;
}

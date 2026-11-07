export type ProjectStatus = 'built' | 'planned';
export type ProjectFilter = 'all' | ProjectStatus;
export type Project = {
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  art: 'sword' | 'map' | 'seed';
  tags: readonly string[];
  year: string;
  stage: string;
  overview: string;
  challenge: string;
  approach: readonly string[];
  outcome: string;
  liveUrl?: string;
  sourceUrl?: string;
};

// EDIT HERE: real contact links only. Empty values are hidden.
export const profile = {
  brand: 'Adonissimo',
  name: 'Lorenz Anthony Salvador',
  displayName: 'Lorenz Salvador',
  location: 'Philippines',
  email: '',
  github: '',
  linkedin: '',
  headline: 'Every project is a new adventure.',
  intro: 'I’m Lorenz. This is my corner of Hyrule: a place for the things I build, the ideas I try, and everything I learn along the way.'
};

// Add real projects here. Planned entries never get demo or repository links.
export const projects: readonly Project[] = [
  {
    slug: 'hyrule-portfolio',
    title: 'The Hyrule Portfolio',
    description: 'A personal quest log built with React, Next.js, and a little Hylian imagination.',
    status: 'built',
    art: 'sword',
    tags: ['Next.js', 'React', 'TypeScript'],
    year: '2026',
    stage: 'Built · deployment pending',
    overview: 'My home for future projects, with a visual world drawn from The Legend of Zelda. The project journal grows as I build new things.',
    challenge: 'Make an unmistakably Zelda-themed portfolio that still works as a readable, useful website on a phone, with a keyboard, and without playing a game first.',
    approach: [
      'Use Next.js App Router for page structure and project-detail routes.',
      'Keep project content in a typed data file instead of duplicating it across pages.',
      'Use small React components for filters and theme controls; render the main content on the server.',
      'Draw the Triforce, Master Sword, Hylian shield, and landscape as original vector fan art.',
      'Support reduced motion, visible keyboard focus, and clear navigation.'
    ],
    outcome: 'The source includes a home page, project journal, individual case-study page, and Vercel configuration. Final build verification and public deployment are the next release steps.'
  },
  {
    slug: 'uncharted-territory',
    title: 'Uncharted territory',
    description: 'The next main quest is still taking shape. A space reserved for a future project.',
    status: 'planned',
    art: 'map',
    tags: ['Future project'],
    year: 'To be announced',
    stage: 'Planned',
    overview: '', challenge: '', approach: [], outcome: ''
  },
  {
    slug: 'a-new-seed',
    title: 'A new seed of an idea',
    description: 'Some side quests start small. This spot is waiting for the next experiment.',
    status: 'planned',
    art: 'seed',
    tags: ['Future experiment'],
    year: 'To be announced',
    stage: 'Planned',
    overview: '', challenge: '', approach: [], outcome: ''
  }
];

export const toolkit = [
  { name: 'Next.js', role: 'World structure', detail: 'App Router & project routes' },
  { name: 'React', role: 'Interaction', detail: 'Reusable UI components' },
  { name: 'TypeScript', role: 'Clarity', detail: 'Typed content & components' },
  { name: 'Tailwind CSS', role: 'Presentation', detail: 'Utilities & theme tokens' },
  { name: 'Vercel', role: 'Deployment target', detail: 'Configuration included' }
] as const;

export function filterProjects(items: readonly Project[], filter: ProjectFilter): readonly Project[] {
  return filter === 'all' ? items : items.filter(project => project.status === filter);
}

export function getProject(slug: string): Project | undefined {
  return projects.find(project => project.slug === slug && project.status === 'built');
}

// Keep credentials and executable protocols out of configurable public links.
export function safeHttps(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function emailHref(value: string): string | undefined {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n?&#%]/.test(value)
    ? `mailto:${value}` : undefined;
}

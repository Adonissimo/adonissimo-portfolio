import type { Realm } from '@/components/realm-glyph';

export type BackdropScene = Realm | 'riverside';
export type RealmBackdrop = { realm: Realm; scene: BackdropScene; src: string; quiet: boolean };

const scenery: Record<BackdropScene, { realm: Realm; src: string }> = {
  sky: { realm: 'sky', src: '/images/backgrounds/sky-atlas.png' },
  zonai: { realm: 'zonai', src: '/images/backgrounds/zonai-atlas.png' },
  fields: { realm: 'fields', src: '/images/hyrule-atlas.png' },
  depths: { realm: 'depths', src: '/images/backgrounds/depths-atlas.png' },
  riverside: { realm: 'fields', src: '/images/backgrounds/riverside-atlas.png' }
};

function select(scene: BackdropScene, quiet = false): RealmBackdrop {
  return { scene, ...scenery[scene], quiet };
}

/** Stable environment selection for pages and their nested detail routes. */
export function backdropForPath(pathname: string | null): RealmBackdrop | null {
  if (pathname === null) return null;
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return select('sky');
  if (path === '/about') return select('fields');
  if (path === '/contact') return select('riverside');
  if (path === '/projects' || path.startsWith('/projects/')) return select('zonai');
  if (path === '/blog' || path.startsWith('/blog/')) return select('depths');
  if (path === '/admin' || path.startsWith('/admin/') || ['/login', '/signup', '/forgot-password', '/reset-password'].includes(path)) return select('zonai', true);
  return null;
}

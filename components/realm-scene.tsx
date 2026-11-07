import Image from 'next/image';
import type { Realm } from './realm-glyph';

const scenery: Record<Realm, string> = {
  sky: '/images/backgrounds/sky-atlas.png',
  zonai: '/images/zonai-workshop-cutout.png',
  fields: '/images/hyrule-fields-cutout.png',
  depths: '/images/ornaments/lightroot.png'
};

/** Decorative fan-art scenery. It never stands in for project evidence. */
export function RealmScene({ realm, className = '', sizes = '(max-width: 560px) 100vw, 540px' }: { realm: Realm; className?: string; sizes?: string }) {
  return <div className={`realm-scene ${className}`} data-scene={realm} aria-hidden="true"><Image src={scenery[realm]} alt="" width={realm === 'depths' ? 1254 : 1536} height={realm === 'depths' ? 1254 : 1024} sizes={sizes} draggable={false}/></div>;
}

export function realmForPath(pathname: string | null): Realm {
  if (pathname === '/') return 'sky';
  if (pathname === '/about' || pathname === '/contact') return 'fields';
  if (pathname === '/blog' || pathname?.startsWith('/blog/')) return 'depths';
  return 'zonai';
}

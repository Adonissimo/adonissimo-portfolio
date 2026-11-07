'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { realmForPath } from './realm-scene';
import { RealmOrnament } from './realm-ornament';

const paintings = {
  sky: '/images/sky-island.png',
  zonai: '/images/zonai-workshop.png',
  fields: '/images/hyrule-fields.png',
  depths: '/images/depths-lightroot.png'
};

export function FooterScenery() {
  const pathname = usePathname();
  const realm = realmForPath(pathname);
  const publicPage = pathname === '/' || pathname === '/about' || pathname === '/contact' || pathname === '/projects' || pathname?.startsWith('/projects/') || pathname === '/blog' || pathname?.startsWith('/blog/');
  return <div className="footer-landscape" data-scene={realm} aria-hidden="true"><div className="footer-scenery" data-scene={realm}><Image src={paintings[realm]} alt="" width={1536} height={1024} sizes="(max-width: 1160px) 100vw, 1160px" draggable={false}/></div>{publicPage && <RealmOrnament realm={realm} className="footer-relic" sizes="100px"/>}</div>;
}

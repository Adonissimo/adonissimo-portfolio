import Image from 'next/image';
import type { Realm } from './realm-glyph';

const relics: Record<Realm, string> = {
  sky: '/images/ornaments/hero-relics.png',
  zonai: '/images/ornaments/zonai-relic.png',
  fields: '/images/ornaments/silent-princess.png',
  depths: '/images/ornaments/lightroot.png'
};

/** Transparent, decorative fan illustrations; never content or a control. */
export function RealmOrnament({ realm, className = '', sizes = '(max-width: 560px) 96px, 180px' }: { realm: Realm; className?: string; sizes?: string }) {
  return <span className={`realm-ornament ${className}`} data-relic={realm} aria-hidden="true"><Image src={relics[realm]} alt="" width={1254} height={1254} sizes={sizes} draggable={false}/></span>;
}

/** Original geometric carving, not a translation of fictional writing. */
export function AncientSeal({ className = '' }: { className?: string }) {
  return <svg className={`ancient-seal ${className}`} viewBox="0 0 240 240" fill="none" aria-hidden="true" focusable="false">
    <circle className="seal-track" cx="120" cy="120" r="108" pathLength={1}/>
    <path className="seal-track" pathLength={1} d="M45 62a94 94 0 0 1 150 0M212 101a94 94 0 0 1-46 102M74 203a94 94 0 0 1-46-102"/>
    <path d="M120 4v17m0 198v17M4 120h17m198 0h17M40 40l12 12m136 136 12 12M40 200l12-12M188 52l12-12M110 35l10-9 10 9-10 9Z"/>
    <path d="m69 72 6-6 6 6-6 6Zm90 0 6-6 6 6-6 6Zm-45 131 6-6 6 6-6 6Z"/>
  </svg>;
}

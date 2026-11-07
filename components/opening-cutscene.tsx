import Image from 'next/image';
import { profile } from '@/lib/content';
import { AncientSeal } from './realm-ornament';
import { Triforce } from './zelda-art';

/** Two short, authored camera sequences made from the portfolio's existing PNG art. */
export function OpeningCutscene({ kind, arriving = false }: { kind: 'prologue' | 'entry'; arriving?: boolean }) {
  return <div className={`opening-film opening-film-${kind}`} data-arriving={arriving} aria-hidden="true">
    <div className="film-stage">
      {kind === 'prologue' && <div className="film-shot film-forest"><Image src="/images/hyrule-fields.png" alt="" fill sizes="100vw" loading="eager" draggable={false}/></div>}
      <div className={`film-shot ${kind === 'prologue' ? 'film-sky' : 'film-gateway'}`}><Image src="/images/sky-island.png" alt="" fill sizes="100vw" loading="eager" draggable={false}/></div>
      <span className="film-light"/>
      <span className="film-haze film-haze-far"/><span className="film-haze film-haze-near"/>
      <div className="film-carving"><AncientSeal className="film-seal"/><Triforce className="film-crest"/></div>
      <span className="film-shade"/>
    </div>
    <div className="film-captions">
      {kind === 'prologue' ? <>
        <p className="film-caption film-caption-first">Every adventure begins<br/><em>with curiosity.</em></p>
        <p className="film-caption film-caption-last">There’s always<br/><em>another path.</em></p>
      </> : <p className="film-caption film-caption-entry">The next chapter<br/><em>is yours to explore.</em></p>}
    </div>
    <p className="film-identity">{profile.displayName} <span aria-hidden="true">·</span> Full-stack web</p>
    <div className="film-letterbox"/>
  </div>;
}

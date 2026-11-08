'use client';

import Image from 'next/image';
import { useRef, type CSSProperties } from 'react';
import { profile } from '@/lib/content';
import { AncientSeal } from './realm-ornament';
import { Triforce } from './zelda-art';

/** Two short, authored camera sequences made from the portfolio's existing PNG art. */
export function OpeningCutscene({ kind, arriving = false, compact = false, onReady }: { kind: 'prologue' | 'entry'; arriving?: boolean; compact?: boolean; onReady?: () => void }) {
  const loaded = useRef(new Set<string>());
  function settled(image: HTMLImageElement, shot: string, failed = false) {
    const finish = (decoded: boolean) => {
      if (!image.isConnected) return;
      image.setAttribute('data-loaded', decoded ? 'true' : 'failed');
      loaded.current.add(shot);
      if (kind === 'entry' || (loaded.current.has('forest') && loaded.current.has('sky'))) onReady?.();
    };
    if (failed || typeof image.decode !== 'function') finish(!failed);
    else void image.decode().then(() => finish(true), () => finish(false));
  }
  return <div className={`opening-film opening-film-${kind}`} data-arriving={arriving} aria-hidden="true">
    <div className="film-stage">
      {kind === 'prologue' && <div className="film-shot film-forest"><Image src="/images/hyrule-fields.png" alt="" fill sizes="100vw" loading="eager" draggable={false} onLoad={event => settled(event.currentTarget, 'forest')} onError={event => settled(event.currentTarget, 'forest', true)}/></div>}
      <div className={`film-shot ${kind === 'prologue' ? 'film-sky' : 'film-gateway'}`}><Image src="/images/sky-island.png" alt="" fill sizes="100vw" loading="eager" draggable={false} onLoad={event => settled(event.currentTarget, 'sky')} onError={event => settled(event.currentTarget, 'sky', true)}/></div>
      <div className="film-aura"><span className="film-aura-crown"/><span className="film-aura-heart"/></div>
      <span className="film-light"/>
      <span className="film-haze film-haze-far"/><span className="film-haze film-haze-near"/>
      <div className="film-carving"><AncientSeal className="film-seal"/><Triforce className="film-crest"/></div>
      <div className="film-stardust">{Array.from({ length: compact ? 8 : 16 }, (_, index) => <i key={index} style={{ '--mote-x': `${12 + index * 29 % 78}%`, '--mote-y': `${18 + index * 17 % 60}%`, '--mote-delay': `${-index * .43}s`, '--mote-life': `${6 + index % 4}s` } as CSSProperties}/>)}</div>
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

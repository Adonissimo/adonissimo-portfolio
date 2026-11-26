'use client';

import Image from 'next/image';
import { useRef, useState, type KeyboardEvent } from 'react';
import { safeHttps } from '@/lib/content';
import { gameHeroes, gameRealms, gameScreens } from '@/lib/zeldabonk-media';
import { Icon } from './icons';

const allMedia = [...gameScreens, ...gameRealms, ...gameHeroes];

/** Actual game captures and exported artwork, separate from editable CMS prose. */
export function ZeldaBonkShowcase({ liveUrl }: { liveUrl?: string | null }) {
  const [screen, setScreen] = useState(0), [expanded, setExpanded] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), opener = useRef<HTMLElement | null>(null);
  const playUrl = safeHttps(liveUrl ?? undefined);
  const active = gameScreens[screen], enlarged = expanded === null ? null : allMedia[expanded];
  function open(index: number, button: HTMLButtonElement) {
    opener.current = button; setExpanded(index);
    if (!dialog.current?.open) dialog.current?.showModal();
  }
  function step(direction: number) { setExpanded(index => index === null ? null : (index + direction + allMedia.length) % allMedia.length); }
  function keyboard(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
  }
  return <section className="zeldabonk-showcase" aria-label="ZeldaBonk game preview">
    <div className="bonk-intro">
      <figure className="bonk-feature">
        <button type="button" className="bonk-preview" aria-label={`Enlarge: ${active.title}`} onClick={event => open(screen, event.currentTarget)}>
          <Image src={active.src} alt={active.alt} width={657} height={559} sizes="(max-width: 760px) 100vw, 657px" loading="eager"/>
          <span className="bonk-enlarge"><Icon name="external"/> View full image</span>
        </button>
        <figcaption aria-live="polite">{active.caption}</figcaption>
        <div className="bonk-thumbnails" role="group" aria-label="Game screenshots">
          {gameScreens.map((item, index) => <button type="button" key={item.src} aria-label={item.title} aria-pressed={screen === index} onClick={() => setScreen(index)}>
            <Image src={item.src} alt="" width={144} height={122} sizes="144px"/><span>{item.title}</span>
          </button>)}
        </div>
      </figure>
      <div className="bonk-pitch">
        <div className="bonk-hero-lineup" aria-hidden="true">{['link', 'zelda', 'midna'].map(id => <Image key={id} src={`/images/projects/zeldabonk/character-${id}.png`} alt="" width={112} height={112}/>)}</div>
        <h2>Choose a hero.<br/><em>Find your next adventure.</em></h2>
        <p>Explore familiar realms, build your loadout, and take on each guardian. Your weapons attack automatically; your job is to keep moving.</p>
        <dl className="bonk-facts"><div><dt>Realms</dt><dd>8</dd></div><div><dt>Levels</dt><dd>24</dd></div><div><dt>Heroes</dt><dd>11</dd></div></dl>
        {playUrl && <a className="button" href={playUrl} target="_blank" rel="noopener noreferrer">Play ZeldaBonk <Icon name="play"/><span className="sr-only"> (opens in a new tab)</span></a>}
        <p className="bonk-try-note">Play in your browser. Try any hero in <strong>Training Grounds</strong> before starting an adventure.</p>
        <ul className="bonk-quick-start"><li><strong>Adventure:</strong> three levels and a guardian in each realm.</li><li><strong>Survival:</strong> hold out, build your power, and face the boss.</li><li><strong>Make it yours:</strong> keyboard and touch controls, camera settings, and reduced motion.</li></ul>
      </div>
    </div>

    <section className="bonk-realms" aria-labelledby="bonk-realms-title">
      <h2 id="bonk-realms-title">Eight realms. Eight guardians.</h2>
      <p>From Kokiri Forest to Termina Field, every map has its own landmark and guardian. Select a preview to take a closer look.</p>
      <div className="bonk-map-grid">{gameRealms.map((realm, index) => <button type="button" className="bonk-map" key={realm.id} aria-label={`View ${realm.name} map preview`} onClick={event => open(gameScreens.length + index, event.currentTarget)}>
        <Image src={realm.src} alt={realm.alt} width={657} height={559} sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw" loading="lazy"/>
        <span className="bonk-map-copy"><strong>{realm.name}</strong><span>{realm.landmark}</span><small>Guardian: {realm.guardian}</small></span>
      </button>)}</div>
      <p className="bonk-source-note">These are real menu previews. Some realms unlock as you progress through Adventure.</p>
    </section>

    <section className="bonk-characters" aria-labelledby="bonk-heroes-title">
      <h2 id="bonk-heroes-title">Find a hero that feels like you.</h2>
      <p>Fast cuts, heavy hits, water attacks, or a little mischief. Meet the full roster and their in-game artwork.</p>
      <div className="bonk-character-grid">{gameHeroes.map((hero, index) => <button type="button" className="bonk-character" key={hero.id} aria-label={`Enlarge ${hero.name} character art`} onClick={event => open(gameScreens.length + gameRealms.length + index, event.currentTarget)}>
        <Image src={hero.src} alt={hero.alt} width={112} height={112} loading="lazy"/>
        <strong>{hero.name}</strong><span className="bonk-character-role">{hero.role}</span><span>{hero.style}</span>
      </button>)}</div>
      <p className="bonk-source-note">Original roster and Ocarina of Time allies, as shown in ZeldaBonk. Screenshots and ten PNG portraits captured from the live game. Darunia uses custom pixel art based on the supplied model reference. Unofficial fan game; not affiliated with Nintendo.</p>
    </section>

    <dialog ref={dialog} className="bonk-lightbox" aria-label="ZeldaBonk image viewer" onKeyDown={keyboard} onClose={() => { setExpanded(null); opener.current?.focus({ preventScroll: true }); }}>
      <div className="bonk-lightbox-toolbar"><button type="button" onClick={() => step(-1)} aria-label="Previous image">←</button><span aria-live="polite">{expanded === null ? '' : `${expanded + 1} / ${allMedia.length}`}</span><button type="button" onClick={() => step(1)} aria-label="Next image">→</button><button type="button" className="bonk-lightbox-close" onClick={() => dialog.current?.close()} aria-label="Close image viewer"><Icon name="close"/></button></div>
      {enlarged && <figure><Image src={enlarged.src} alt={enlarged.alt} width={expanded! >= gameScreens.length + gameRealms.length ? 112 : 657} height={expanded! >= gameScreens.length + gameRealms.length ? 112 : 559} sizes="90vw" unoptimized className={expanded! >= gameScreens.length + gameRealms.length ? 'bonk-lightbox-portrait' : ''}/><figcaption><strong>{enlarged.title}</strong><p>{enlarged.caption}</p></figcaption></figure>}
    </dialog>
  </section>;
}

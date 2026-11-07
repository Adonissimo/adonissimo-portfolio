import { RealmGlyph, type Realm } from './realm-glyph';

export function WorldDivider({ realm = 'sky' }: { realm?: Realm }) {
  return <div className="world-divider" aria-hidden="true">
    <svg viewBox="0 0 360 24" fill="none" focusable="false"><path d="M0 12h256l10-7h40l9 7h45M278 12h21m-17 7h13" stroke="currentColor" strokeWidth="1.5"/><path d="m332 7 5 5-5 5-5-5Z" fill="currentColor"/></svg>
    <RealmGlyph realm={realm}/>
    <svg viewBox="0 0 360 24" fill="none" focusable="false"><path d="M0 12h45l9-7h40l10 7h256M61 12h21m-17 7h13" stroke="currentColor" strokeWidth="1.5"/><path d="m28 7 5 5-5 5-5-5Z" fill="currentColor"/></svg>
  </div>;
}

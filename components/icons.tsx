import type { SVGProps, ReactNode } from 'react';

type Name = 'arrow' | 'diagonal' | 'sun' | 'moon' | 'menu' | 'close' | 'mail' | 'heart' | 'rupee' | 'leaf' | 'sword' | 'map' | 'external' | 'play' | 'motion' | 'pause' | 'music' | 'volume' | 'muted' | 'book' | 'minimize';
const paths: Record<Name, ReactNode> = {
  minimize: <path d="M5 12h14"/>,
  book: <><path d="M12 5C8 2 5 3 2 4v15c3-1 6-2 10 1 4-3 7-2 10-1V4c-3-1-6-2-10 1Zm0 0v15"/><path d="m5 8 4 1M5 12l4 1m6-4 4-1m-4 5 4-1"/></>,
  pause: <><path d="M7 4h3v16H7ZM14 4h3v16h-3Z"/></>,
  music: <><path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/></>,
  volume: <><path d="m11 4-6 5H2v6h3l6 5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
  muted: <><path d="m11 4-6 5H2v6h3l6 5Z"/><path d="m16 9 6 6m0-6-6 6"/></>,
  play: <path d="m8 4 13 8-13 8Z"/>,
  motion: <><path d="M5 5h2v14H5ZM13 5h2v14h-2Z"/><path d="m20 8 2 4-2 4"/></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  diagonal: <path d="M6 18 18 6M6 6h12v12" />,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  heart: <path d="M12 20 3.5 11.4C-1 6 6 0 12 6c6-6 13 0 8.5 5.4Z" />,
  rupee: <><path d="m12 2 6 5v10l-6 5-6-5V7Z"/><path d="M12 2v20M6 7l6 3 6-3M6 17l6-3 6 3"/></>,
  leaf: <><path d="M20 3C4 2 1 13 7 18c7 6 15-3 13-15Z"/><path d="M4 22 16 8m-6 8v-5m0 5h5"/></>,
  sword: <><path d="m15 3 6-1-1 6L9 19l-4-4Z"/><path d="m3 13 8 8M6 18l-4 4m13-14 3 3"/></>,
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 4H4v16h16v-6"/></>
};

export function Icon({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`icon ${className || ''}`} {...props}>{paths[name]}</svg>;
}

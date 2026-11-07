'use client';

import { usePathname } from 'next/navigation';
import { CinematicLink as Link } from './cinematic-link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Icon } from './icons';
import { profile } from '@/lib/content';
import { changeView } from '@/lib/motion';
import { Triforce } from './zelda-art';
import { themeKey, themeSnapshot, serverThemeSnapshot, subscribeTheme } from '@/lib/theme';
import { useSoundEffects } from './sound-effects';

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, serverThemeSnapshot);
  const themeLabel = theme === 'day' ? 'Switch to night theme' : 'Switch to day theme';
  const { player: effects } = useSoundEffects();

  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Element && !e.target.closest('header')) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        void effects.playInteraction();
        setOpen(false);
        document.getElementById('menu-button')?.focus();
      }
    };
    const focusOutside = (e: FocusEvent) => {
      if (e.target instanceof Element && !e.target.closest('.site-header')) setOpen(false);
    };
    const media = window.matchMedia('(min-width: 961px)');
    const resized = () => { if (media.matches) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', focusOutside);
    media.addEventListener('change', resized);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('focusin', focusOutside);
      media.removeEventListener('change', resized);
    };
  }, [open, effects]);

  function toggleTheme() {
    const root = document.documentElement;
    changeView(() => {
      const next = root.dataset.theme === 'day' ? 'night' : 'day';
      root.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'day' ? '#f1efdf' : '#111e19');
      window.dispatchEvent(new Event('hyrule-theme-change'));
      try { localStorage.setItem(themeKey, next); } catch { /* Optional preference. */ }
    }, 'theme');
  }

  return (
    <header className="site-header">
      <div className="header-inner page-shell">
        <Link className="brand" href="/" data-sfx="home" aria-label={`${profile.brand}, ${profile.displayName} home`} onClick={() => setOpen(false)}>
          <Triforce className="brand-triforce" />
          <span><strong>{profile.brand.toUpperCase()}</strong><small>LORENZ SALVADOR · FULL-STACK WEB</small></span>
        </Link>
        <nav aria-label="Main navigation" id="main-navigation" className={open ? 'navigation is-open' : 'navigation'}>
          <Link href="/projects" aria-current={pathname?.startsWith('/projects') ? 'page' : undefined} onClick={() => setOpen(false)}>Projects</Link>
          <Link href="/blog" aria-current={pathname?.startsWith('/blog') ? 'page' : undefined} onClick={() => setOpen(false)}>Field notes</Link>
          <Link href="/about" aria-current={pathname === '/about' ? 'page' : undefined} onClick={() => setOpen(false)}>About</Link>
          <Link className="navigation-contact" href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} onClick={() => setOpen(false)}>Contact</Link>
          <Link href="/login" aria-current={pathname === '/login' ? 'page' : undefined} onClick={() => setOpen(false)}>Journal desk</Link>
        </nav>
        <div className="header-tools">
          <button className="theme-switch js-only" type="button" data-sfx="magic" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
            <Icon name="sun" className="day-icon"/><Icon name="moon" className="night-icon"/>
          </button>
          <Link className="header-contact" href="/contact">Get in touch <Icon name="diagonal"/></Link>
          <button id="menu-button" className="menu-switch js-only" type="button" data-sfx={open ? 'menu-close' : 'menu-open'} aria-controls="main-navigation" aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'}/></button>
        </div>
      </div>
    </header>
  );
}

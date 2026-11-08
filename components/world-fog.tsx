'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { createFogRenderer } from '@/lib/fog';
import { ambienceServerSnapshot, ambienceSnapshot, atmosphereForPath, subscribeAmbience, subscribeVisibility, visibleSnapshot } from '@/lib/ambience';
import { fairyHostSnapshot, serverFairyHostSnapshot, subscribeFairyHost } from '@/lib/fairy';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';
import { motionModeSnapshot, serverMotionSnapshot, subscribeMotion } from '@/lib/motion';
import { serverThemeSnapshot, subscribeTheme, themeSnapshot } from '@/lib/theme';

/** One scenery atmosphere; text shadows replace layout-sized reading cutouts. */
export function WorldFog() {
  const pathname = usePathname();
  const host = useSyncExternalStore(subscribeFairyHost, fairyHostSnapshot, serverFairyHostSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);
  const enabled = useSyncExternalStore(subscribeAmbience, ambienceSnapshot, ambienceServerSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, ambienceServerSnapshot);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, serverThemeSnapshot);
  const { environment, quiet } = atmosphereForPath(pathname);
  const layer = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createFogRenderer>>(null);
  const active = enabled && visible && mode === 'full';

  useEffect(() => {
    const element = layer.current, surface = canvas.current;
    if (!element || !surface) return;
    let created: ReturnType<typeof createFogRenderer>;
    try { created = createFogRenderer(surface, compact, { request: callback => window.requestAnimationFrame(callback), cancel: id => window.cancelAnimationFrame(id) }); }
    catch { return; }
    if (!created) return;
    const painter = created;
    renderer.current = painter;
    const measure = () => {
      const box = element.getBoundingClientRect();
      painter.appearance({ tone: getComputedStyle(element).getPropertyValue('--fog-tone').trim() || '#c2d6d0', quiet: element.dataset.quiet === 'true' });
      painter.resize(box.width, box.height);
      element.dataset.renderer = 'canvas';
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
    observer?.observe(element);
    window.addEventListener('resize', measure);
    window.addEventListener('adonissimo-fog-refresh', measure);
    return () => {
      observer?.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('adonissimo-fog-refresh', measure);
      painter.dispose(); renderer.current = null; delete element.dataset.renderer;
    };
  }, [host, compact]);

  useEffect(() => { window.dispatchEvent(new Event('adonissimo-fog-refresh')); }, [pathname, theme, host, compact]);
  useEffect(() => { renderer.current?.active(active); }, [active, host, compact]);

  const content = <div ref={layer} className="world-fog" data-context={host ? 'opening' : 'page'} data-environment={environment} data-quiet={!host && quiet} data-active={active} aria-hidden="true"><span className="world-fog-rays"/><div className="world-fog-fallback"/><canvas ref={canvas} className="world-fog-canvas"/></div>;
  return host ? createPortal(content, host) : content;
}

'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type Turnstile = {
  render(element: HTMLElement, options: { sitekey: string; theme: string; callback: () => void; 'expired-callback': () => void; 'error-callback': () => void }): string;
  remove(id: string): void;
};

export function TurnstilePreview() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const element = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState('Widget preview is loading…');

  useEffect(() => {
    if (!scriptReady || !key || !element.current) return;
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    let active = true;
    let widget: string | undefined;
    // Vendor callbacks can finish after navigation or a Strict Mode cleanup.
    const report = (message: string) => { queueMicrotask(() => { if (active) setStatus(message); }); };
    try {
      if (!api) throw new Error('Widget API unavailable');
      widget = api.render(element.current, {
        sitekey: key,
        theme: 'auto',
        callback: () => report('Widget completed. Production token verification connects in Phase 4.'),
        'expired-callback': () => report('The widget expired. Complete it again to preview.'),
        'error-callback': () => report('The widget could not complete. Demo messages can still be added locally.')
      });
    } catch { report('The widget is unavailable. This local form preview still works.'); }
    return () => {
      active = false;
      if (widget !== undefined) { try { api?.remove(widget); } catch { /* Vendor cleanup is best effort. */ } }
    };
  }, [scriptReady, key]);

  if (!key) return <div className="preview-note">Turnstile widget is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to preview it. Server verification and real delivery connect in Phase 4.</div>;
  return <div className="preview-note">
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setScriptReady(true)} onError={() => setStatus('The widget could not load. This local demo remains usable.')}/>
    <div ref={element}/><p role="status">{status}</p>
  </div>;
}

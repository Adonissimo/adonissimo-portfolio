'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type TurnstileApi = { render(element: HTMLElement, options: { sitekey: string; theme: string; action: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }): string; remove(id: string): void };
export function Turnstile({ onToken, resetKey }: { onToken: (token: string) => void; resetKey: number }) {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY; const element = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false); const [status, setStatus] = useState('Loading verification…');
  useEffect(() => {
    if (!ready || !key || !element.current) return;
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile; let widget: string | undefined; let active = true;
    const report = (message: string, token = '') => queueMicrotask(() => { if (active) { onToken(token); setStatus(message); } });
    try {
      if (!api) throw new Error('Widget unavailable');
      widget = api.render(element.current, { sitekey: key, theme: 'auto', action: 'contact', callback: token => report('Verification complete.', token), 'expired-callback': () => report('Verification expired. Please complete it again.'), 'error-callback': () => report('Verification could not complete. Please retry.') });
    } catch { report('Verification is temporarily unavailable.'); }
    return () => { active = false; if (widget !== undefined) { try { api?.remove(widget); } catch { /* Vendor cleanup is best effort. */ } } };
  }, [ready, key, onToken, resetKey]);
  if (!key) return <p role="status">Message verification is not available yet.</p>;
  return <div className="verification-field"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => { onToken(''); setStatus('Verification could not load. Check your connection and reload.'); }}/><div ref={element}/><p role="status">{status}</p></div>;
}

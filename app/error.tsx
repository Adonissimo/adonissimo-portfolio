'use client';

import { CinematicLink as Link } from '@/components/cinematic-link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main" className="not-found page-shell"><h1>A small detour.</h1><p>This page couldn’t load. Try again, or return to the journal.</p><div className="contact-actions flex flex-wrap items-center justify-center gap-6"><button className="button" onClick={reset}>Try again</button><Link className="quiet-link" href="/">Back to the journal</Link></div></main>;
}

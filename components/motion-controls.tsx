'use client';

import { usePathname } from 'next/navigation';
import { markIntroSeen } from '@/lib/motion';
import { Icon } from './icons';

export function MotionControls() {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return <div className="motion-controls js-only" aria-label="Welcome controls">
    <button type="button" className="motion-replay" data-sfx="page-back" onClick={() => markIntroSeen(false)} title="Replay the welcome screen"><Icon name="play"/> Replay welcome</button>
  </div>;
}

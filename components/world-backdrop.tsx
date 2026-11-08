'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { backdropForPath } from '@/lib/realm-background';

export function WorldBackdrop() {
  const backdrop = backdropForPath(usePathname());
  if (!backdrop) return null;

  return <div className={`world-backdrop${backdrop.quiet ? ' world-backdrop-quiet' : ''}`} data-world={backdrop.realm} data-background={backdrop.scene} aria-hidden="true">
    <Image key={backdrop.scene} className="world-atlas" src={backdrop.src} alt="" fill sizes="100vw" loading="eager" draggable={false}/>
  </div>;
}

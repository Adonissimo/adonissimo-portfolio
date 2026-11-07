'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { beginNavigation, navigationDirection } from '@/lib/motion';

type Props = Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'> & { href: string };

export function CinematicLink({ href, scroll, ...props }: Props) {
  const router = useRouter();
  return <Link {...props} href={href} scroll={scroll} onNavigate={event => {
    const target = new URL(href, window.location.href);
    const current = new URL(window.location.href);
    // Let native hash links, modified clicks, downloads and external targets behave normally.
    if (target.origin !== current.origin || (target.pathname === current.pathname && target.search === current.search)) return;
    event.preventDefault();
    beginNavigation(() => router.push(href, { scroll: scroll !== false }), navigationDirection(current.pathname, target.pathname));
  }}/>;
}

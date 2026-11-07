'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { DemoStore } from '@/lib/demo-store';
import type { DemoAction, Role } from '@/lib/phase-three';

const store = new DemoStore();

export function useDemo(role: Role) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  useEffect(() => { store.hydrate(() => window.sessionStorage); }, []);
  return { ...snapshot, commit: (action: DemoAction) => store.commit(role, action), reset: store.reset };
}

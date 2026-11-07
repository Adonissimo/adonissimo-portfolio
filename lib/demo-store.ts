import { changeDemo, demoKey, initialDemo, readDemo, type DemoAction, type DemoState, type Role } from './phase-three.ts';

export type DemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type CommitResult = 'stored' | 'memory' | 'rejected';
export type DemoSnapshot = Readonly<{ state: DemoState; ready: boolean; error: string; fatal: boolean }>;

/** Shared tab-local preview state. Browser storage is accessed only during hydration. */
export class DemoStore {
  private initial: DemoSnapshot = Object.freeze({ state: initialDemo(), ready: false, error: '', fatal: false });
  private snapshot = this.initial;
  private listeners = new Set<() => void>();
  private storage: DemoStorage | undefined;
  private hydrated = false;

  getSnapshot = (): DemoSnapshot => this.snapshot;
  getServerSnapshot = (): DemoSnapshot => this.initial;
  subscribe = (notify: () => void): (() => void) => { this.listeners.add(notify); return () => this.listeners.delete(notify); };

  private publish(patch: Partial<DemoSnapshot>): void {
    this.snapshot = Object.freeze({ ...this.snapshot, ...patch });
    this.listeners.forEach(notify => notify());
  }

  hydrate(getStorage: () => DemoStorage): void {
    if (this.hydrated) return;
    this.hydrated = true;
    let raw: string | null;
    try {
      this.storage = getStorage();
      raw = this.storage.getItem(demoKey);
    } catch {
      this.storage = undefined;
      this.publish({ ready: true, error: 'Browser session storage is unavailable. You can explore the demo, but changes will be lost when the page reloads.', fatal: false });
      return;
    }
    try { this.publish({ state: readDemo(raw), ready: true, error: '', fatal: false }); }
    catch { this.publish({ ready: true, error: 'The saved demo data is invalid. Reset the demo session to start again.', fatal: true }); }
  }

  commit(role: Role, action: DemoAction): CommitResult {
    if (!this.snapshot.ready || this.snapshot.fatal) return 'rejected';
    const next = changeDemo(this.snapshot.state, role, action);
    if (next === this.snapshot.state) {
      this.publish({ error: 'This change could not be applied. Check the entry and your demo role.' });
      return 'rejected';
    }
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.setItem(demoKey, JSON.stringify(next));
      this.publish({ state: next, error: '', fatal: false });
      return 'stored';
    } catch {
      this.publish({ state: next, error: 'The change is in memory only. Browser storage could not save it; keep this page open or enable session storage and reload.', fatal: false });
      return 'memory';
    }
  }

  reset = (): void => {
    let error = '';
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.removeItem(demoKey);
    } catch { error = 'The demo was reset in memory only. Browser storage could not be cleared.'; }
    this.publish({ state: initialDemo(), ready: true, error, fatal: false });
  };
}

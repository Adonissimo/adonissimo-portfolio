export type Role = 'owner' | 'editor' | 'viewer';
export function isRole(value: unknown): value is Role { return value === 'owner' || value === 'editor' || value === 'viewer'; }
export const demoCookie = 'adonissimo-demo-role';
// IDs identify sample records, never credentials or security tokens.
export function createDemoId(): string {
 if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
 const random=typeof globalThis.crypto?.getRandomValues === 'function' ? Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2))).join('-') : Math.random().toString(36).slice(2);
 return `demo-${Date.now().toString(36)}-${random}`;
}
export type Entry = { id: string; title: string; slug: string; description: string; tags: string; body: string; published: boolean; liveUrl?: string; sourceUrl?: string };
export type Message = { id: string; name: string; email: string; subject: string; body: string; status: 'unread' | 'read' | 'archived' | 'spam' };
export type DemoState = { projects: Entry[]; posts: Entry[]; messages: Message[]; users: { id: string; name: string; role: Role }[]; settings: { ownerEmail: boolean; confirmation: boolean; badge: boolean }; audit: string[] };
export const demoKey = 'adonissimo-phase3-v1';
export const demoPosts: readonly Entry[] = [
 { id: 'post-one', title: 'Inside the Hyrule field journal', slug: 'inside-the-field-journal', description: 'A demonstration article about the portfolio’s visual world.', tags: 'Design, Next.js', published: true, body: '# A place for each adventure\n\nThis is a **demo article** for the Phase 3 preview, not a claim about completed client work.\n\n## The journal\n\nProjects are collected like entries in a field journal. Navigation stays familiar while the Triforce, forest palette and parchment carry the Zelda theme.\n\n- Readable text\n- Clear navigation\n- Optional sound and motion\n\n## A small example\n\n```ts\nconst nextQuest = "Keep building";\n```\n\n[Explore the projects](/projects)' },
 { id: 'post-two', title: 'Making room for quiet', slug: 'making-room-for-quiet', description: 'A sample journal entry about optional sound and reduced motion.', tags: 'Accessibility, React', published: true, body: '# Making room for quiet\n\nThis **demo article** illustrates Markdown rendering.\n\n## Let the visitor choose\n\nMusic, interaction sounds and animation have separate controls. A visitor can enter silently and still explore the same work.\n\n> The story should remain readable when the effects are turned off.\n\nUse the footer’s motion control to try the reduced-motion experience.' }
];
export function initialDemo(): DemoState { return { projects: [{ id: 'portfolio', title: 'The Hyrule Portfolio', slug: 'hyrule-portfolio', description: 'The portfolio project — demo management record.', tags: 'Next.js, React, TypeScript', body: 'A Zelda fan portfolio.', published: true }], posts: demoPosts.map(post => ({ ...post })), messages: [{ id: 'sample-message', name: 'Sample visitor', email: 'visitor@example.test', subject: 'A new adventure', body: 'This is a sample message. No email was sent.', status: 'unread' }], users: [{ id: 'owner', name: 'Demo Owner', role: 'owner' }, { id: 'editor', name: 'Demo Editor', role: 'editor' }, { id: 'viewer', name: 'Demo Viewer', role: 'viewer' }], settings: { ownerEmail: true, confirmation: true, badge: true }, audit: [] }; }
export function canEdit(role: Role) { return role === 'owner' || role === 'editor'; }
export function safeMarkdownHref(href: string): string | undefined { if (Array.from(href).some(character => character === '\\' || character.charCodeAt(0) <= 32)) return undefined; if (/^\/(?!\/)/.test(href) || /^#[a-z0-9_-]+$/i.test(href)) return href; try { const url = new URL(href); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Optional browser state. */ } return undefined; }
export function entryError(entry: Entry, entries: readonly Entry[]): string | undefined {
 if (!entry.id || entry.id.length > 100) return 'The entry identifier is invalid. Create a new entry.';
 if (!entries.some(item => item.id === entry.id) && entries.length >= 50) return 'This demo supports up to 50 entries. Remove an entry before adding another.';
 if (entry.tags.length > 500) return 'Keep technology tags under 500 characters.';
 if (!entry.title.trim() || entry.title.length > 120) return 'Use a title between 1 and 120 characters.';
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) || entry.slug.length > 100) return 'Use a unique lowercase slug with words separated by hyphens.';
 if (entries.some(item => item.id !== entry.id && item.slug === entry.slug)) return 'That slug is already used. Choose another.';
 if (!entry.description.trim() || entry.description.length > 500) return 'Add a description of up to 500 characters.';
 for (const value of [entry.liveUrl,entry.sourceUrl]) { if (value) { try { const url=new URL(value); if(url.protocol!=='https:'||url.username||url.password)return 'Project links must use HTTPS without credentials.'; } catch { return 'Enter a full HTTPS project link.'; } } }
 if (!entry.body.trim() || entry.body.length > 30000) return 'Add content of up to 30,000 characters.';
 return undefined;
}
export function contactErrors(values: Pick<Message, 'name' | 'email' | 'subject' | 'body'>): Record<string, string> {
 const errors: Record<string, string> = {};
 if (values.name.trim().length < 2 || values.name.length > 80) errors.name = 'Use a name between 2 and 80 characters.';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) errors.email = 'Enter a valid email address.';
 if (values.subject.trim().length < 3 || values.subject.length > 120) errors.subject = 'Use a subject between 3 and 120 characters.';
 if (values.body.trim().length < 10 || values.body.length > 4000) errors.body = 'Write a message between 10 and 4,000 characters.';
 return errors;
}
export type DemoAction = { type: 'save'; collection: 'projects' | 'posts'; entry: Entry } | { type: 'delete'; collection: 'projects' | 'posts'; id: string } | { type: 'message'; id: string; status: Message['status'] } | { type: 'receive'; message: Message } | { type: 'role'; id: string; role: Role } | { type: 'settings'; settings: DemoState['settings'] };
/** Preview-only UI constraints. These are NOT server authorization or production RBAC. */
export function changeDemo(state: DemoState, role: Role, action: DemoAction): DemoState {
 let next: DemoState = state;
 if (action.type === 'receive' && action.message.id && !state.messages.some(message => message.id === action.message.id) && ['unread','read','archived','spam'].includes(action.message.status) && Object.keys(contactErrors(action.message)).length === 0) next = { ...state, messages: [action.message, ...state.messages].slice(0, 50) };
 if (action.type === 'save' && canEdit(role) && !entryError(action.entry, state[action.collection])) next = { ...state, [action.collection]: state[action.collection].some(item => item.id === action.entry.id) ? state[action.collection].map(item => item.id === action.entry.id ? action.entry : item) : [...state[action.collection], action.entry] };
 if (action.type === 'delete' && role === 'owner') next = { ...state, [action.collection]: state[action.collection].filter(item => item.id !== action.id) };
 if (action.type === 'message' && role === 'owner') next = { ...state, messages: state.messages.map(item => item.id === action.id ? { ...item, status: action.status } : item) };
 if (action.type === 'role' && role === 'owner' && action.id !== 'owner') next = { ...state, users: state.users.map(item => item.id === action.id ? { ...item, role: action.role } : item) };
 if (action.type === 'settings' && role === 'owner') next = { ...state, settings: action.settings };
 return next === state ? state : { ...next, audit: [`${role}: ${action.type} (browser demo)`, ...state.audit].slice(0, 50) };
}
export function readDemo(raw: string | null): DemoState {
 if (!raw) return initialDemo();
 if (raw.length > 4 * 1024 * 1024) throw new Error('Demo data is too large');
 const parsed: unknown = JSON.parse(raw);
 if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid demo session');
 const state = parsed as DemoState;
 const lists = [state.projects,state.posts,state.messages,state.users,state.audit];
 if (lists.some(items => !Array.isArray(items) || items.length > 50)) throw new Error('Invalid demo lists');
 if (!state.settings || typeof state.settings !== 'object' || Array.isArray(state.settings)) throw new Error('Invalid settings');
 for (const entries of [state.projects,state.posts]) {
  const ids=new Set<string>(); const slugs=new Set<string>();
  for (const entry of entries) {
   if (!entry || typeof entry !== 'object' || ['id','title','slug','description','body','tags'].some(key => typeof entry[key as keyof Entry] !== 'string') || typeof entry.published !== 'boolean') throw new Error('Invalid entry');
   if ([entry.liveUrl,entry.sourceUrl].some(value => value !== undefined && typeof value !== 'string') || entryError(entry,[]) || ids.has(entry.id) || slugs.has(entry.slug)) throw new Error('Invalid or duplicate entry');
   ids.add(entry.id);slugs.add(entry.slug);
  }
 }
 const messageIds=new Set<string>();
 for (const message of state.messages) {
  if (!message || typeof message !== 'object' || ['id','name','email','subject','body'].some(key => typeof message[key as keyof Message] !== 'string') || !['unread','read','archived','spam'].includes(message.status) || !message.id || messageIds.has(message.id) || Object.keys(contactErrors(message)).length) throw new Error('Invalid message');
  messageIds.add(message.id);
 }
 const userIds=new Set<string>();
 for (const user of state.users) {
  if (!user || typeof user.id !== 'string' || !user.id || userIds.has(user.id) || typeof user.name !== 'string' || user.name.length > 120 || !isRole(user.role)) throw new Error('Invalid user');
  userIds.add(user.id);
 }
 if (state.audit.some(item => typeof item !== 'string' || item.length > 250) || ['ownerEmail','confirmation','badge'].some(key => typeof state.settings[key as keyof DemoState['settings']] !== 'boolean')) throw new Error('Invalid settings');
 return state;
}

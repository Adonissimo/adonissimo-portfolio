import { requireActor } from '@/lib/backend/auth';
import { json, route } from '@/lib/backend/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Read the current database role through the same verified session checks as
// protected content. This read does not extend an otherwise idle session.
export const GET = route(async () => {
  const actor = await requireActor('read', false);
  return json({ user: { id: actor.id, role: actor.role } });
});

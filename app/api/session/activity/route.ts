import { requireActor } from '@/lib/backend/auth';
import { json, rateLimit, route, sameOrigin } from '@/lib/backend/http';
export const POST = route(async request => {
  sameOrigin(request); const actor = await requireActor('read', false);
  await rateLimit(request, 'session-activity', 5, 60, actor.id);
  await requireActor('read', true);
  return json({ ok: true });
});

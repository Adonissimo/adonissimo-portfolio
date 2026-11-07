import { requireActor } from '@/lib/backend/auth';
import { route } from '@/lib/backend/http';
import { imageResponse } from '@/lib/backend/media';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return route(async () => { const actor = await requireActor('write', false); return imageResponse(actor.db, id, true); })(request);
}

import { AppError, type Collection } from '@/lib/backend/domain';
import { publicDb } from '@/lib/backend/db';
import { listEntries } from '@/lib/backend/content';
import { json, route } from '@/lib/backend/http';

export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  return route(async req => {
    if (kind !== 'projects' && kind !== 'posts') throw new AppError(404, 'Collection not found.');
    return json(await listEntries(publicDb(), kind as Collection, new URL(req.url).searchParams, true));
  })(request);
}

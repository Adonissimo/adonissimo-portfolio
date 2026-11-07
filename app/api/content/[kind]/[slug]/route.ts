import { AppError } from '@/lib/backend/domain';
import { publishedEntry } from '@/lib/backend/content';
import { json, route } from '@/lib/backend/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await context.params;
  return route(async () => {
    if (kind !== 'projects' && kind !== 'posts') throw new AppError(404, 'Collection not found.');
    const item = await publishedEntry(kind, slug);
    if (!item) throw new AppError(404, 'Entry not found.');
    return json({ item });
  })(request);
}

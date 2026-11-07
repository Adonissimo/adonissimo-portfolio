import { backendConfigured } from '@/lib/backend/config';
import { publicDb } from '@/lib/backend/db';
import { json } from '@/lib/backend/http';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!backendConfigured()) return json({ status: 'unavailable' }, 503);
  try { const { data, error } = await publicDb().rpc('healthcheck'); return json({ status: !error && data === true ? 'ok' : 'unavailable' }, !error && data === true ? 200 : 503); }
  catch { return json({ status: 'unavailable' }, 503); }
}

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceDb } from './db';
import { AppError, uuid } from './domain';
import { dbFailure } from './http';

export async function imageResponse(db: SupabaseClient, id: string, isPrivate: boolean) {
  const found = await db.from('media').select('derivative_path').eq('id', uuid(id)).maybeSingle(); dbFailure(found.error);
  if (!found.data) throw new AppError(404, 'Image not found.');
  const file = await serviceDb().storage.from('portfolio-media').download(found.data.derivative_path); dbFailure(file.error);
  if (!file.data) throw new AppError(404, 'Image not found.');
  return new Response(await file.data.arrayBuffer(), { headers: { 'Content-Type': 'image/webp', 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': isPrivate ? 'private, no-store' : 'public, max-age=60, must-revalidate' } });
}

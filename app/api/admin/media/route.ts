import { randomUUID } from 'node:crypto';
import sharp, { type OutputInfo } from 'sharp';
import { requireActor } from '@/lib/backend/auth';
import { serviceDb } from '@/lib/backend/db';
import { AppError } from '@/lib/backend/domain';
import { dbFailure, json, rateLimit, readBytes, route, sameOrigin } from '@/lib/backend/http';

export const runtime = 'nodejs';
export const POST = route(async request => {
  sameOrigin(request);
  const actor = await requireActor('write');
  await rateLimit(request, 'upload', 10, 900, actor.id);
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data;')) throw new AppError(415, 'Send an image upload.');
  const bytes = await readBytes(request, 6 * 1024 * 1024);
  const form = await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) throw new AppError(422, 'Choose a PNG, JPEG or WebP image smaller than 5 MB.');
  const original = Buffer.from(await file.arrayBuffer());
  let processed: { data: Buffer; info: OutputInfo }; let format: string;
  try {
    const image = sharp(original, { limitInputPixels: 32000000, animated: false, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!metadata.format || !['png','jpeg','webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error('Unsupported image');
    format = metadata.format;
    processed = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  } catch { throw new AppError(422, 'This image could not be decoded. Choose a standard PNG, JPEG or WebP file.'); }
  if (processed.data.length > 2097152) throw new AppError(422, 'The processed image is too large. Choose a smaller image.');
  const id = randomUUID(); const originalPath = `originals/${actor.id}/${id}.${format}`; const derivativePath = `processed/${id}.webp`;
  const service = serviceDb(); const bucket = service.storage.from('portfolio-media'); const uploaded: string[] = [];
  try {
    const source = await bucket.upload(originalPath, original, { contentType: `image/${format}`, upsert: false }); dbFailure(source.error); uploaded.push(originalPath);
    const result = await bucket.upload(derivativePath, processed.data, { contentType: 'image/webp', upsert: false }); dbFailure(result.error); uploaded.push(derivativePath);
    const saved = await service.from('media').insert({ id, uploader_id: actor.id, original_path: originalPath, derivative_path: derivativePath, width: processed.info.width, height: processed.info.height, bytes: processed.data.length }).select('id,width,height').single();
    dbFailure(saved.error);
    return json({ item: saved.data, preview: `/api/admin/media/${id}`, publicUrl: `/media/${id}` }, 201);
  } catch (error) {
    if (uploaded.length) { const cleanup = await bucket.remove(uploaded); if (cleanup.error) console.error('media_cleanup_deferred', { id }); }
    throw error;
  }
});

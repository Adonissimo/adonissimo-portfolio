'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

export function ProjectImagePreview() {
  const reader = useRef<FileReader | null>(null);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => () => { reader.current?.abort(); reader.current = null; }, []);

  function select(event: ChangeEvent<HTMLInputElement>) {
    const previous = reader.current;
    reader.current = null;
    previous?.abort();
    setImage('');
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choose a PNG, JPEG or WebP smaller than 2 MB.');
      event.target.value = '';
      return;
    }
    const next = new FileReader();
    reader.current = next;
    next.onload = () => { if (reader.current === next && typeof next.result === 'string') setImage(next.result); };
    next.onerror = () => { if (reader.current === next) setError('The image could not be read. Choose another file.'); };
    try { next.readAsDataURL(file); }
    catch { setError('The image could not be opened. Choose another file.'); }
  }

  return <div>
    <label>Image preview (PNG, JPEG or WebP, max 2 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={select} aria-describedby="project-image-help"/></label>
    <small id="project-image-help">Local preview only. Upload/storage and resizing connect in Phase 4.</small>
    {error && <p className="field-error" role="alert">{error}</p>}
    {image && <Image src={image} unoptimized alt="Selected project image preview" width={320} height={180} style={{ objectFit: 'contain' }} onError={() => { setImage(''); setError('This file is not a readable image. Choose another file.'); }}/>}
  </div>;
}

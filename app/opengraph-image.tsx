import { ImageResponse } from 'next/og';
import { profile } from '@/lib/content';

export const alt = `${profile.brand} — ${profile.displayName}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', color: '#eee8d3', background: '#111e19' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#d6bc7e', marginBottom: 48 }}>
        <svg width="75" height="66" viewBox="0 0 40 36" fill="currentColor">
          <path d="m20 1 10 17.3H10ZM10 18.3 20 35.6H0Zm20 0 10 17.3H20Z"/>
        </svg>
        <span style={{ fontSize: 25, letterSpacing: 5 }}>{profile.brand.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', fontSize: 76, letterSpacing: -2, lineHeight: 1.1 }}>Every project.</div>
      <div style={{ display: 'flex', fontSize: 76, letterSpacing: -2, color: '#d6bc7e', lineHeight: 1.1 }}>A new adventure.</div>
      <div style={{ display: 'flex', fontSize: 26, marginTop: 42 }}>{`${profile.displayName} · Developer portfolio`}</div>
    </div>,
    size
  );
}

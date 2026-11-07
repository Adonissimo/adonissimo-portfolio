import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/login', '/signup', '/forgot-password', '/reset-password', '/auth', '/api'] }, ...(site ? { sitemap: new URL('/sitemap.xml', site).href } : {}) };
}

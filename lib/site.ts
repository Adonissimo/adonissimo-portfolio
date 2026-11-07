import { safeHttps } from './content.ts';

// Only an explicitly supplied deployment URL creates canonical or sitemap URLs.
export function getSiteUrl(): URL | undefined {
  const value = safeHttps(process.env.NEXT_PUBLIC_SITE_URL);
  return value ? new URL(new URL(value).origin) : undefined;
}

// Social-image paths always need a base, including local builds before deployment.
export function getMetadataBase(): URL {
  const siteUrl = getSiteUrl();
  if (siteUrl) return siteUrl;

  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    const value = host ? safeHttps(`https://${host}`) : undefined;
    if (value) return new URL(new URL(value).origin);
  }

  return new URL('http://localhost:3000');
}

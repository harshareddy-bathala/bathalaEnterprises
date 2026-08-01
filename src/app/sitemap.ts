import { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { propertyPath, servicePath } from '@/lib/slug';
import { getPropertiesFromSupabase, getServicesFromSupabase } from '@/lib/supabase-queries';

/**
 * Date the static (non-CMS) pages last meaningfully changed. Bump it when the
 * copy on those pages is edited. Previously every URL — including the privacy
 * policy — was stamped with `new Date()` on each crawl, which trains crawlers
 * to ignore `lastmod` entirely.
 */
const STATIC_CONTENT_LAST_MODIFIED = new Date('2026-08-01T00:00:00.000Z');

function toDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl;

  const [properties, services] = await Promise.all([
    getPropertiesFromSupabase(false),
    getServicesFromSupabase(),
  ]);

  // Freshest listing timestamp doubles as the "last modified" for index pages.
  const latestPropertyChange = properties.reduce<Date>(
    (latest, property) => {
      const changed = toDate(property.updated_at ?? property.created_at, latest);
      return changed > latest ? changed : latest;
    },
    STATIC_CONTENT_LAST_MODIFIED
  );

  const latestServiceChange = services.reduce<Date>(
    (latest, service) => {
      const changed = toDate(service.updated_at ?? service.created_at, latest);
      return changed > latest ? changed : latest;
    },
    STATIC_CONTENT_LAST_MODIFIED
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestPropertyChange,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: latestPropertyChange,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: latestServiceChange,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: STATIC_CONTENT_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${baseUrl}${propertyPath(property)}`,
    lastModified: toDate(property.updated_at ?? property.created_at, STATIC_CONTENT_LAST_MODIFIED),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}${servicePath(service)}`,
    lastModified: toDate(service.updated_at ?? service.created_at, STATIC_CONTENT_LAST_MODIFIED),
    changeFrequency: 'weekly' as const,
    priority: 0.58,
  }));

  return [...staticPages, ...propertyPages, ...servicePages];
}

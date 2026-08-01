import { MetadataRoute } from 'next';
import { siteUrl as baseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const host = (() => {
    try {
      return new URL(baseUrl).host;
    } catch {
      return 'bathalaenterprises.com';
    }
  })();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    host,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

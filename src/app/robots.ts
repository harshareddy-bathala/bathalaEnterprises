import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bathalaenterprises.com';
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

/** @type {import('next').NextConfig} */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bathalaenterprises.com';
const isProduction = process.env.NODE_ENV === 'production';
const siteHost = (() => {
  try {
    return new URL(siteUrl).host;
  } catch {
    return 'bathalaenterprises.com';
  }
})();

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: !isProduction,
  
  // Enable experimental features for better performance
  experimental: isProduction
    ? {
        optimizePackageImports: ['@supabase/supabase-js', 'framer-motion'],
      }
    : {},
  
  // Image optimization
  images: {
    unoptimized: !isProduction,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Bundle analyzer (uncomment to analyze)
  // ...(process.env.ANALYZE && {
  //   webpack: (config, { isServer }) => {
  //     if (!isServer) {
  //       const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //       config.plugins.push(
  //         new BundleAnalyzerPlugin({
  //           analyzerMode: 'static',
  //           reportFilename: '../analyze/client.html',
  //         })
  //       );
  //     }
  //     return config;
  //   },
  // }),
  
  // Security headers for production
  async headers() {
    if (!isProduction) {
      return [];
    }

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      },
      // Cache static assets aggressively
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).avif',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Stale-while-revalidate for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      // Static pages with ISR
      {
        source: '/((?!api|_next|favicon).*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },

  // Redirects for SEO
  async redirects() {
    if (!isProduction) {
      return [];
    }

    // Canonical structure is /properties[/<slug>] and /services[/<slug>].
    // The old "all-" listing paths and the UUID detail URLs both 301 here;
    // slug resolution and the UUID -> slug hop happen in the page itself,
    // since this config cannot know the id -> slug mapping.
    const redirects = [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/all-properties',
        destination: '/properties',
        permanent: true,
      },
      {
        source: '/all-services/:id',
        destination: '/services/:id',
        permanent: true,
      },
      {
        source: '/all-services',
        destination: '/services',
        permanent: true,
      },
    ];

    redirects.unshift({
      source: '/:path*',
      has: [
        {
          type: 'header',
          key: 'x-forwarded-proto',
          value: 'http',
        },
      ],
      destination: `https://${siteHost}/:path*`,
      permanent: true,
    });

    return redirects;
  },
};

export default nextConfig;
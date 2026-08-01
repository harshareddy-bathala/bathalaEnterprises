import { MetadataRoute } from 'next';
import { siteUrl as baseUrl } from '@/lib/seo';

/**
 * AI crawlers and answer-engine agents.
 *
 * Listed explicitly and allowed: an absent rule is ambiguous, and several of
 * these agents treat silence conservatively. Being enumerated here is what
 * makes the catalogue eligible to appear in AI answers. `/llms.txt` gives them
 * a structured entry point.
 *
 * To opt out of AI training while staying visible in AI *search*, move
 * 'CCBot' and 'Google-Extended' into a disallow rule — they are the
 * training-corpus crawlers, not the retrieval ones.
 */
const AI_AGENTS = [
  'GPTBot',            // OpenAI crawler
  'OAI-SearchBot',     // ChatGPT search index
  'ChatGPT-User',      // ChatGPT live browsing on a user's behalf
  'ClaudeBot',         // Anthropic crawler
  'Claude-User',       // Claude live browsing on a user's behalf
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',   // Gemini / Vertex grounding
  'Applebot-Extended',
  'CCBot',             // Common Crawl
  'Amazonbot',
  'Bytespider',
];

export default function robots(): MetadataRoute.Robots {
  const host = (() => {
    try {
      return new URL(baseUrl).host;
    } catch {
      return 'bathalaenterprises.com';
    }
  })();

  const disallow = ['/admin/', '/api/', '/maintenance', '/offline'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow,
      },
      {
        userAgent: AI_AGENTS,
        allow: ['/', '/llms.txt'],
        disallow,
      },
    ],
    host,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

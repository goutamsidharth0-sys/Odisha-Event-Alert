import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep crawl budget on clean canonical paths; don't crawl query-string
        // filter permutations (?city=, ?category=, ?search= …) or admin.
        disallow: ['/admin/', '/*?'],
      },
      // Explicitly Allow AI Search Engines (AI SEO optimization)
      // Reference: awesome-skills/ai-seo
      {
        userAgent: ['GPTBot', 'ChatGPT-User'],
        allow: '/',
      },
      {
        userAgent: ['PerplexityBot'],
        allow: '/',
      },
      {
        userAgent: ['ClaudeBot', 'anthropic-ai'],
        allow: '/',
      },
      {
        userAgent: ['Google-Extended'],
        allow: '/',
      },
      {
        userAgent: ['Bingbot'],
        allow: '/',
      },
      // Block pure training scrapers that don't provide citations
      {
        userAgent: ['CCBot'],
        disallow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

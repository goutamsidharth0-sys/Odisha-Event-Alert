import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://odishaeventalert.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/'],
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

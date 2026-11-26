import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/config/site';
import { getDomainCandidates } from '@/lib/domain';

/**
 * Sitemap-en genereres ved forespørsel, ikke ved bygg.
 *
 * FUNNET 26.11.2026: sitemap.xml svarte med 2 URL-er — forsiden og /personvern —
 * mens forsiden lenket til åtte artikler. Artikkelspørringen hadde feilet, og det
 * stille `catch`-et gjorde feilen om til en tom liste som så helt frisk ut. Med
 * `revalidate` ble den tomme sitemap-en så servert fra ISR-cachen og fra
 * Cloudflare (x-nextjs-cache: HIT, cf-cache-status: HIT). Samme feil som på
 * vekstmotoren.no 23.11.2026, og de tolv andre magasinene har alt denne malen.
 * `force-dynamic` koster ingenting for ti URL-er, og en sitemap skal vise det som
 * finnes nå, ikke det som fantes da svaret ble cachet.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `https://${SITE_CONFIG.displayDomain}`;
  const domainCandidates = getDomainCandidates(SITE_CONFIG.domain);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/personvern`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const articles = await prisma.article
    .findMany({
      where: {
        status: 'published',
        publisher: { domain: { in: domainCandidates } },
      },
      select: {
        id: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    })
    // Stille catch gjorde feilen usynlig: sitemap-en ble generert med null
    // artikler og så helt frisk ut. Nå skrives feilen — én linje, ingen hemmeligheter.
    .catch((e) => {
      console.error('sitemap: artikkelspørringen feilet —', String(e?.message ?? e).split('\n')[0].slice(0, 300));
      return [];
    });

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/artikkel/${article.id}`,
    lastModified: article.publishedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}

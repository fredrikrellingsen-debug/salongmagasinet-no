import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/config/site';
import { getDomainCandidates } from '@/lib/domain';

export const revalidate = 300;

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
    .catch(() => []);

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/artikkel/${article.id}`,
    lastModified: article.publishedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}

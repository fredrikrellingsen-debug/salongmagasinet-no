import { SITE_CONFIG } from '@/config/site';
import { prisma } from '@/lib/prisma';
import { getDomainCandidates } from '@/lib/domain';

/**
 * /llms.txt — magasinet fortalt til en AI-motor, i ren tekst.
 *
 * Samme mal som de tretten andre magasinene (se auton.no): seksjonene, de
 * nyeste sakene og hvem som utgir dem, hentet fra samme database og
 * konfigurasjon som sitemap bruker. Filen er ikke en garanti — den er en hjelp
 * for en motor som vil forstå hva magasinet er uten å gjette, og den skal si
 * det samme som sidene.
 *
 * 26.11.2026: de fire nye magasinene svarte 404 på /llms.txt.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = `https://${SITE_CONFIG.displayDomain}`;
  const domener = getDomainCandidates(SITE_CONFIG.domain);

  const saker = await prisma.article
    .findMany({
      where: { status: 'published', publisher: { domain: { in: domener } } },
      select: { id: true, title: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    .catch((e) => {
      console.error('llms.txt: artikkelspørringen feilet —', String(e?.message ?? e).split('\n')[0].slice(0, 300));
      return [];
    });

  const linjer: string[] = [
    `# ${SITE_CONFIG.siteName}`,
    '',
    `> ${SITE_CONFIG.description}`,
    '',
    'Utgiver: AIChat Norge AS, org.nr 933 851 222.',
    `Nettside: ${base}`,
    `Redaksjon: ${SITE_CONFIG.editorialEmail}`,
    `Tips: ${SITE_CONFIG.tipsEmail}`,
    '',
    '## Seksjoner',
    '',
  ];

  for (const kategori of SITE_CONFIG.categories ?? []) {
    linjer.push(`- [${kategori}](${base}/?kategori=${encodeURIComponent(kategori)})`);
  }

  linjer.push('', '## Siste saker', '');
  if (saker.length === 0) {
    linjer.push('(ingen publiserte saker akkurat nå)');
  } else {
    for (const sak of saker) {
      const dato = sak.publishedAt ? ` (${sak.publishedAt.toISOString().slice(0, 10)})` : '';
      linjer.push(`- [${sak.title}](${base}/artikkel/${sak.id})${dato}`);
    }
  }

  linjer.push(
    '',
    '## Om',
    '',
    `- [Personvern](${base}/personvern)`,
    `- [Annonsering og kommersielt samarbeid](${base}/annonsering)`,
    '',
  );

  return new Response(linjer.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

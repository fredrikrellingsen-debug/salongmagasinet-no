import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AdBanner from '@/components/AdBanner';
import LeadForm from '@/components/LeadForm';
import ReadingProgress from '@/components/ReadingProgress';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';
import { SITE_CONFIG } from '@/config/site';
import { getDomainCandidates } from '@/lib/domain';
import { filterPublicTags, sanitizeHtml, sanitizeImageSrc } from '@/lib/sanitize';
import {
  estimateReadMinutes,
  extractCategory,
  extractExcerpt,
  extractFirstImage,
  formatNorwegianDate,
  getContrastInk,
} from '@/lib/articleMeta';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export const revalidate = 60;

interface ArticlePageProps {
  params: { id: string };
}

const STRIP_DATA_CATEGORY_DIV =
  /<div\b[^>]*\bdata-category\s*=[^>]*>[\s\S]*?<\/div>/gi;

function isEditorialCustomer(
  customer: { email?: string | null; companyName?: string | null } | null | undefined,
  domainCandidates: string[]
): boolean {
  const email = (customer?.email || '').trim().toLowerCase();
  const editorialEmail = SITE_CONFIG.editorialEmail.trim().toLowerCase();
  if (
    email &&
    (email === editorialEmail ||
      email.startsWith('redaksjon@') ||
      domainCandidates.some((d) => email === `redaksjon@${d}` || email === `redaksjonen@${d}`))
  ) {
    return true;
  }

  const name = (customer?.companyName || '').trim().toLowerCase();
  if (!name) return true;
  if (
    name.includes('redaktør-teamet') ||
    name.includes('redaksjon') ||
    name === SITE_CONFIG.siteName.toLowerCase()
  ) {
    return true;
  }

  return false;
}

function getSafeWebsiteUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    return null;
  }

  let candidate: string;
  if (/^https?:\/\//i.test(trimmed)) {
    candidate = trimmed;
  } else if (trimmed.includes(':')) {
    return null;
  } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(trimmed)) {
    candidate = `https://${trimmed}`;
  } else {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      !parsed.hostname ||
      !parsed.hostname.includes('.')
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const domainCandidates = getDomainCandidates(SITE_CONFIG.domain);

  const article = await prisma.article
    .findFirst({
      where: {
        id: params.id,
        status: 'published',
        publisher: { domain: { in: domainCandidates } },
      },
      include: {
        customer: {
          select: { companyName: true, tags: true },
        },
        publisher: {
          select: { name: true },
        },
      },
    })
    .catch(() => null);

  if (!article) {
    return {
      title: 'Artikkel ikke funnet',
      description: 'Artikkelen du leter etter finnes ikke.',
    };
  }

  const siteName = SITE_CONFIG.siteName;
  const description = extractExcerpt(article.content, 158);
  const articleUrl = `https://${SITE_CONFIG.displayDomain}/artikkel/${article.id}`;
  const ogImage = sanitizeImageSrc(extractFirstImage(article.content));
  const category = extractCategory(article, SITE_CONFIG.categories);

  return {
    title: article.title,
    description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: `${article.title} | ${siteName}`,
      description,
      url: articleUrl,
      siteName,
      type: 'article',
      section: category,
      publishedTime: article.publishedAt?.toISOString(),
      locale: 'nb_NO',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 675,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const domainCandidates = getDomainCandidates(SITE_CONFIG.domain);

  const article = await prisma.article
    .findFirst({
      where: {
        id: params.id,
        status: 'published',
        publisher: { domain: { in: domainCandidates } },
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            companyName: true,
            tags: true,
            websiteUrl: true,
          },
        },
        publisher: {
          select: {
            adsEnabled: true,
            leadsEnabled: true,
          },
        },
      },
    })
    .catch(() => null);

  if (!article) {
    notFound();
  }

  const adsEnabled = article.publisher?.adsEnabled ?? false;
  const leadsEnabled = article.publisher?.leadsEnabled ?? false;

  const [ads, relatedArticles] = await Promise.all([
    adsEnabled
      ? prisma.adCampaign
          .findMany({
            where: { publisher: { domain: { in: domainCandidates } } },
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.article
      .findMany({
        where: {
          id: { not: article.id },
          status: 'published',
          publisher: { domain: { in: domainCandidates } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        include: {
          customer: {
            select: {
              companyName: true,
              tags: true,
            },
          },
        },
      })
      .catch(() => []),
  ]);

  const articleUrl = `https://${SITE_CONFIG.displayDomain}/artikkel/${article.id}`;
  const cleanHtml = sanitizeHtml(article.content).replace(STRIP_DATA_CATEGORY_DIV, '');
  const isEditorial = isEditorialCustomer(article.customer, domainCandidates);
  const publicTags = filterPublicTags(article.customer?.tags);
  const safeWebsiteUrl = isEditorial ? null : getSafeWebsiteUrl(article.customer?.websiteUrl);
  const category = extractCategory(article, SITE_CONFIG.categories);
  const readMinutes = estimateReadMinutes(article.content);
  const heroOrArticleImg = sanitizeImageSrc(extractFirstImage(article.content));
  const absoluteImageUrl = heroOrArticleImg.startsWith('http')
    ? heroOrArticleImg
    : `https://${SITE_CONFIG.displayDomain}${heroOrArticleImg}`;

  const accentInk = getContrastInk(SITE_CONFIG.theme.accent);
  const variant = SITE_CONFIG.layoutVariant;
  const cardRadius =
    variant === 'modern-tech'
      ? 'rounded-2xl'
      : variant === 'editorial-grid'
      ? 'rounded-xl'
      : 'rounded-sm';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: extractExcerpt(article.content, 160),
    articleSection: category,
    image: [absoluteImageUrl],
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    dateModified: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    author: [
      {
        '@type': 'Organization',
        name: SITE_CONFIG.siteName,
        url: `https://${SITE_CONFIG.displayDomain}`,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.siteName,
      url: `https://${SITE_CONFIG.displayDomain}`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  return (
    <>
      <ReadingProgress />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-12">
        <article className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Toppnavigasjon */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider min-h-[44px] hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Tilbake til forsiden
            </Link>

            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
              <Link
                href={`/?kategori=${encodeURIComponent(category)}`}
                className="font-semibold hover:underline"
                style={{ color: 'var(--ink)' }}
              >
                {category}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{SITE_CONFIG.siteName}</span>
            </div>
          </div>

          {/* Redaksjonell artikkeltopp */}
          <header className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
              <Link
                href={`/?kategori=${encodeURIComponent(category)}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {category}
              </Link>

              {article.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  <time dateTime={new Date(article.publishedAt).toISOString()}>
                    {formatNorwegianDate(article.publishedAt, 'long')}
                  </time>
                </span>
              )}

              <span aria-hidden="true">•</span>

              <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: 'var(--ink)' }}>
                <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                {readMinutes} min lesing
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black leading-[1.14] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            >
              {article.title}
            </h1>

            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                {isEditorial ? (
                  <span
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    <Building2 className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                    Redaksjonen i {SITE_CONFIG.siteName}
                  </span>
                ) : (
                  article.customer?.companyName && (
                    <span
                      className="inline-flex items-center gap-1.5 font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      <Building2 className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                      Fagkilde: {article.customer.companyName}
                    </span>
                  )
                )}

                {publicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {publicTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--muted)',
                        }}
                      >
                        <Tag className="w-3 h-3" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <BookmarkButton
                  domain={SITE_CONFIG.displayDomain}
                  article={{
                    id: article.id,
                    title: article.title,
                    category,
                    image: heroOrArticleImg,
                  }}
                  variant="pill"
                />
                <ShareButton title={article.title} url={articleUrl} />
              </div>
            </div>
          </header>

          {/* Artikkelinnhold */}
          <div
            className={`border p-5 sm:p-10 lg:p-12 ${cardRadius}`}
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="magazine-prose prose prose-stone max-w-[68ch] mx-auto prose-headings:font-bold prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />

            {/* Mid-Article Ad Banner Slot */}
            {adsEnabled && (
              <div className="max-w-[68ch] mx-auto">
                <AdBanner
                  ads={ads}
                  slotId="article_mid"
                  adsEnabled={adsEnabled}
                  className="my-10"
                />
              </div>
            )}

            {/* Bottom Article Ad Banner Slot */}
            {adsEnabled && (
              <div className="max-w-[68ch] mx-auto">
                <AdBanner
                  ads={ads}
                  slotId="article_bottom"
                  adsEnabled={adsEnabled}
                  className="my-10"
                />
              </div>
            )}

            {/* Lead Form / Redaksjonell kontakt */}
            {leadsEnabled && (
              <div className="max-w-[68ch] mx-auto">
                <LeadForm
                  customerId={article.customerId}
                  companyName={article.customer?.companyName}
                  sourceUrl={articleUrl}
                  isEditorial={isEditorial}
                  siteName={SITE_CONFIG.siteName}
                />
              </div>
            )}

            {/* Redaksjons- eller samarbeidsboks */}
            <div
              className="max-w-[68ch] mx-auto border-t mt-10 pt-6 flex items-start gap-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-black text-base shrink-0"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {SITE_CONFIG.shortMark}
              </div>
              <div className="space-y-2">
                {isEditorial ? (
                  <>
                    <h2
                      className="font-bold text-sm flex items-center gap-1.5"
                      style={{ color: 'var(--ink)' }}
                    >
                      Redaksjonen i {SITE_CONFIG.siteName}{' '}
                      <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      Denne artikkelen er skrevet av redaksjonen i{' '}
                      <strong style={{ color: 'var(--ink)' }}>{SITE_CONFIG.siteName}</strong>. Vårt
                      mål er å dele uavhengig, nyttig innsikt og aktuelt fagstoff med norske lesere.
                    </p>
                  </>
                ) : (
                  <>
                    <h2
                      className="font-bold text-sm flex items-center gap-1.5"
                      style={{ color: 'var(--ink)' }}
                    >
                      Redaksjonelt samarbeid{' '}
                      <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    </h2>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                      Publisert i {SITE_CONFIG.siteName} i samarbeid med{' '}
                      <strong style={{ color: 'var(--ink)' }}>
                        {article.customer?.companyName || 'fagmiljøet'}
                      </strong>
                      . Vårt mål er å dele nyttig innsikt og aktuelt fagstoff med norske lesere.
                    </p>
                    {safeWebsiteUrl && article.customer?.companyName && (
                      <div className="pt-1">
                        <a
                          href={safeWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold transition-opacity hover:opacity-90 ${cardRadius}`}
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: accentInk,
                          }}
                        >
                          <span>Besøk {article.customer.companyName}</span>
                          <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Relaterte saker ("Les også i <Magasin>") */}
        {relatedArticles.length > 0 && (
          <section
            aria-labelledby="les-ogsa-heading"
            className="max-w-6xl mx-auto pt-4 space-y-6"
          >
            <div
              className="flex items-center justify-between gap-4 border-b-2 pb-3"
              style={{ borderColor: 'var(--ink)' }}
            >
              <h2
                id="les-ogsa-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
              >
                Les også i {SITE_CONFIG.siteName}
              </h2>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider min-h-[44px] hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Alle saker <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => {
                const relCategory = extractCategory(rel, SITE_CONFIG.categories);
                const relImage = sanitizeImageSrc(extractFirstImage(rel.content));
                const relMinutes = estimateReadMinutes(rel.content);

                return (
                  <article
                    key={rel.id}
                    className={`group border overflow-hidden flex flex-col justify-between transition-colors ${cardRadius}`}
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
                        <Link href={`/artikkel/${rel.id}`} className="block">
                          <img
                            src={relImage}
                            alt={rel.title}
                            width={800}
                            height={450}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-[16/9] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        </Link>
                        <Link
                          href={`/?kategori=${encodeURIComponent(relCategory)}`}
                          className="absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                          style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                        >
                          {relCategory}
                        </Link>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                          {rel.publishedAt && (
                            <span>{formatNorwegianDate(rel.publishedAt, 'short')}</span>
                          )}
                          <span aria-hidden="true">•</span>
                          <span>{relMinutes} min lesing</span>
                        </div>
                        <Link href={`/artikkel/${rel.id}`} className="block">
                          <h3
                            className="text-base sm:text-lg font-bold leading-snug group-hover:opacity-80 transition-opacity line-clamp-3"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                          >
                            {rel.title}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <div
                      className="px-5 py-3 border-t flex items-center justify-between"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Link
                        href={`/artikkel/${rel.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider min-h-[44px] hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Les saken <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>

                      <BookmarkButton
                        domain={SITE_CONFIG.displayDomain}
                        article={{
                          id: rel.id,
                          title: rel.title,
                          category: relCategory,
                          image: relImage,
                        }}
                        variant="icon"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdBanner from '@/components/AdBanner';
import BookmarkButton from '@/components/BookmarkButton';
import { SITE_CONFIG } from '@/config/site';
import { getDomainCandidates } from '@/lib/domain';
import { sanitizeImageSrc } from '@/lib/sanitize';
import {
  estimateReadMinutes,
  extractCategory,
  extractExcerpt,
  extractFirstImage,
  formatNorwegianDate,
  getContrastInk,
  isDarkHex,
} from '@/lib/articleMeta';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Compass,
  FolderOpen,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

export const revalidate = 60;

interface EnrichedArticle {
  id: string;
  title: string;
  content: string;
  publishedAt: Date | null;
  companyName: string | null;
  tags: string[];
  category: string;
  readMinutes: number;
  image: string;
  excerpt: string;
}

export default async function Frontpage({
  searchParams,
}: {
  searchParams?: { kategori?: string; sok?: string };
}) {
  const domainCandidates = getDomainCandidates(SITE_CONFIG.domain);

  const publisher = await prisma.publisher
    .findFirst({
      where: { domain: { in: domainCandidates } },
    })
    .catch(() => null);

  const adsEnabled = publisher?.adsEnabled ?? false;

  const rawArticles = await prisma.article
    .findMany({
      where: {
        publisher: { domain: { in: domainCandidates } },
        status: 'published',
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        customer: {
          select: {
            companyName: true,
            tags: true,
          },
        },
      },
    })
    .catch(() => []);

  const allEnriched: EnrichedArticle[] = rawArticles.map((article) => ({
    id: article.id,
    title: article.title,
    content: article.content,
    publishedAt: article.publishedAt,
    companyName: article.customer?.companyName ?? null,
    tags: article.customer?.tags ?? [],
    category: extractCategory(article, SITE_CONFIG.categories),
    readMinutes: estimateReadMinutes(article.content),
    image: sanitizeImageSrc(extractFirstImage(article.content)),
    excerpt: extractExcerpt(article.content, 220),
  }));

  const rawCategory = searchParams?.kategori?.trim() || '';
  const rawSearch = searchParams?.sok?.trim() || '';
  const categoryFilter = rawCategory.toLowerCase();
  const searchFilter = rawSearch.toLowerCase();
  const isFiltered = Boolean(categoryFilter || searchFilter);

  const articles = allEnriched.filter((article) => {
    let matchesCategory = true;
    if (categoryFilter) {
      const catLower = article.category.toLowerCase();
      matchesCategory =
        catLower === categoryFilter ||
        catLower.includes(categoryFilter) ||
        article.tags.some((t) => t.toLowerCase().includes(categoryFilter)) ||
        article.title.toLowerCase().includes(categoryFilter) ||
        article.excerpt.toLowerCase().includes(categoryFilter);
    }

    let matchesSearch = true;
    if (searchFilter) {
      matchesSearch =
        article.title.toLowerCase().includes(searchFilter) ||
        article.excerpt.toLowerCase().includes(searchFilter) ||
        article.content.toLowerCase().includes(searchFilter) ||
        article.category.toLowerCase().includes(searchFilter) ||
        (article.companyName?.toLowerCase().includes(searchFilter) ?? false);
    }

    return matchesCategory && matchesSearch;
  });

  // Live antall artikler per kategori for redaksjonell oversikt
  const categoryCounts = SITE_CONFIG.categories.map((cat) => {
    const count = allEnriched.filter(
      (item) => item.category.toLowerCase() === cat.toLowerCase()
    ).length;
    return { name: cat, count };
  });

  const ads = adsEnabled
    ? await prisma.adCampaign
        .findMany({
          where: { publisher: { domain: { in: domainCandidates } } },
        })
        .catch(() => [])
    : [];

  const variant = SITE_CONFIG.layoutVariant;
  const accentInk = getContrastInk(SITE_CONFIG.theme.accent);
  const aboutBgIsDark = isDarkHex(SITE_CONFIG.theme.headerBg);
  const aboutSecondaryText = aboutBgIsDark
    ? 'rgba(255, 255, 255, 0.86)'
    : 'var(--muted)';
  const aboutBorder = aboutBgIsDark ? 'rgba(255, 255, 255, 0.16)' : 'var(--border)';

  const cardRadius =
    variant === 'modern-tech'
      ? 'rounded-2xl'
      : variant === 'editorial-grid'
      ? 'rounded-xl'
      : 'rounded-sm';

  const useEditorialShowcase = !isFiltered && articles.length >= 4;
  const heroArticle = articles[0];
  const featuredStrip = useEditorialShowcase ? articles.slice(1, 3) : [];
  const feedArticles = useEditorialShowcase ? articles.slice(3) : articles.slice(1);
  const latestSidebar = allEnriched.slice(0, 5);

  const renderHeroCard = (hero: EnrichedArticle) => {
    const bookmarkPayload = {
      id: hero.id,
      title: hero.title,
      category: hero.category,
      image: hero.image,
    };

    if (variant === 'editorial-grid') {
      return (
        <article
          className={`group relative border overflow-hidden ${cardRadius}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Desktop/Pad: Dramatisk redaksjonell overlay; Mobil: ren vertikal stack */}
          <div className="relative">
            <Link href={`/artikkel/${hero.id}`} className="block relative overflow-hidden">
              <div className="w-full aspect-[16/9] max-h-[540px] overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
                <img
                  src={hero.image}
                  alt={hero.title}
                  width={1200}
                  height={675}
                  fetchPriority="high"
                  loading="eager"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div
                className="hidden md:block absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
                aria-hidden="true"
              />
            </Link>

            <div className="absolute top-3.5 right-3.5 z-10">
              <BookmarkButton
                domain={SITE_CONFIG.displayDomain}
                article={bookmarkPayload}
                variant="overlay"
              />
            </div>

            <div className="p-5 sm:p-7 md:p-9 lg:p-10 md:absolute md:inset-x-0 md:bottom-0 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <Link
                  href={`/?kategori=${encodeURIComponent(hero.category)}`}
                  className="inline-flex items-center px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px]"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  {hero.category}
                </Link>
                <span className="inline-flex items-center gap-1 font-medium text-[var(--muted)] md:text-white/90">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  {hero.readMinutes} min lesing
                </span>
                {hero.publishedAt && (
                  <span className="inline-flex items-center gap-1 text-[var(--muted)] md:text-white/85">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatNorwegianDate(hero.publishedAt, 'short')}
                  </span>
                )}
              </div>

              <Link href={`/artikkel/${hero.id}`} className="block group/title">
                <h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-black leading-[1.12] tracking-tight text-[var(--ink)] md:text-white group-hover/title:underline decoration-2 underline-offset-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {hero.title}
                </h1>
              </Link>

              <p className="text-sm sm:text-base leading-relaxed max-w-3xl text-[var(--muted)] md:text-white/90 line-clamp-3">
                {hero.excerpt}
              </p>

              <div className="pt-1">
                <Link
                  href={`/artikkel/${hero.id}`}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  Les saken <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      );
    }

    if (variant === 'modern-tech') {
      return (
        <article
          className={`group border overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 ${cardRadius}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="lg:col-span-7 relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
            <Link href={`/artikkel/${hero.id}`} className="block h-full">
              <img
                src={hero.image}
                alt={hero.title}
                width={1200}
                height={675}
                fetchPriority="high"
                loading="eager"
                className="w-full h-full aspect-[16/9] lg:aspect-auto lg:min-h-[400px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </Link>
            <div className="absolute top-3.5 right-3.5 z-10">
              <BookmarkButton
                domain={SITE_CONFIG.displayDomain}
                article={bookmarkPayload}
                variant="overlay"
              />
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <Link
                  href={`/?kategori=${encodeURIComponent(hero.category)}`}
                  className="inline-flex items-center px-3 py-1 rounded-lg font-bold uppercase tracking-wider text-[11px]"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  {hero.category}
                </Link>
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--muted)' }}>
                  <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  {hero.readMinutes} min lesing
                </span>
              </div>

              <Link href={`/artikkel/${hero.id}`} className="block">
                <h1
                  className="text-2xl sm:text-3xl xl:text-[2.15rem] font-extrabold leading-[1.16] tracking-tight transition-opacity group-hover:opacity-85"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  {hero.title}
                </h1>
              </Link>

              <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {hero.excerpt}
              </p>
            </div>

            <div
              className="pt-4 border-t flex items-center justify-between gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {formatNorwegianDate(hero.publishedAt, 'short')}
              </span>
              <Link
                href={`/artikkel/${hero.id}`}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                Les saken <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      );
    }

    if (variant === 'bold-magazine') {
      return (
        <article
          className={`group border border-t-4 overflow-hidden ${cardRadius}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            borderTopColor: 'var(--accent)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
              <Link href={`/artikkel/${hero.id}`} className="block h-full">
                <img
                  src={hero.image}
                  alt={hero.title}
                  width={1200}
                  height={675}
                  fetchPriority="high"
                  loading="eager"
                  className="w-full h-full aspect-[16/9] lg:aspect-auto lg:min-h-[410px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </Link>
              <Link
                href={`/?kategori=${encodeURIComponent(hero.category)}`}
                className="absolute top-4 left-4 z-10 inline-flex items-center px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-sm shadow"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {hero.category}
              </Link>
              <div className="absolute top-3.5 right-3.5 z-10">
                <BookmarkButton
                  domain={SITE_CONFIG.displayDomain}
                  article={bookmarkPayload}
                  variant="overlay"
                />
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <span className="inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  Hovedsak
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  {hero.readMinutes} min lesing
                </span>
                {hero.publishedAt && (
                  <>
                    <span>•</span>
                    <span>{formatNorwegianDate(hero.publishedAt, 'short')}</span>
                  </>
                )}
              </div>

              <Link href={`/artikkel/${hero.id}`} className="block">
                <h1
                  className="text-2xl sm:text-3xl xl:text-4xl font-black leading-[1.12] tracking-tight transition-opacity group-hover:opacity-80"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  {hero.title}
                </h1>
              </Link>

              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
                {hero.excerpt}
              </p>

              <div className="pt-2">
                <Link
                  href={`/artikkel/${hero.id}`}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-5 text-xs font-black uppercase tracking-wider rounded-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  Les saken <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      );
    }

    // Standard: 'classic-newspaper'
    return (
      <article
        className={`group border overflow-hidden ${cardRadius}`}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
            <Link href={`/artikkel/${hero.id}`} className="block h-full">
              <img
                src={hero.image}
                alt={hero.title}
                width={1200}
                height={675}
                fetchPriority="high"
                loading="eager"
                className="w-full h-full aspect-[16/9] lg:aspect-auto lg:min-h-[410px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
            </Link>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={`/?kategori=${encodeURIComponent(hero.category)}`}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm"
                    style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                  >
                    {hero.category}
                  </Link>
                  <span className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--muted)' }}>
                    <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    {hero.readMinutes} min lesing
                  </span>
                </div>
                <BookmarkButton
                  domain={SITE_CONFIG.displayDomain}
                  article={bookmarkPayload}
                  variant="icon"
                />
              </div>

              <Link href={`/artikkel/${hero.id}`} className="block">
                <h1
                  className="text-2xl sm:text-3xl xl:text-[2.35rem] font-black leading-[1.14] tracking-tight transition-opacity group-hover:opacity-80"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  {hero.title}
                </h1>
              </Link>

              <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {hero.excerpt}
              </p>
            </div>

            <div
              className="pt-4 border-t flex items-center justify-between gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                <span>{formatNorwegianDate(hero.publishedAt, 'short')}</span>
              </div>

              <Link
                href={`/artikkel/${hero.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider min-h-[44px] hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Les saken <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderArticleCard = (article: EnrichedArticle, featured = false) => {
    const bookmarkPayload = {
      id: article.id,
      title: article.title,
      category: article.category,
      image: article.image,
    };

    return (
      <article
        className={`group border overflow-hidden flex flex-col justify-between transition-colors ${cardRadius}`}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div>
          <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
            <Link href={`/artikkel/${article.id}`} className="block">
              <img
                src={article.image}
                alt={article.title}
                width={800}
                height={450}
                loading="lazy"
                decoding="async"
                className={`w-full aspect-[16/9] object-cover group-hover:scale-[1.03] transition-transform duration-300 ${
                  featured ? 'sm:max-h-[270px]' : ''
                }`}
              />
            </Link>
            <Link
              href={`/?kategori=${encodeURIComponent(article.category)}`}
              className={`absolute top-3 left-3 z-10 inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                variant === 'modern-tech' || variant === 'editorial-grid'
                  ? 'rounded-full'
                  : 'rounded-sm'
              }`}
              style={{ backgroundColor: 'var(--accent)', color: accentInk }}
            >
              {article.category}
            </Link>
          </div>

          <div className={featured ? 'p-5 sm:p-6 space-y-2.5' : 'p-5 space-y-2.5'}>
            <div className="flex flex-wrap items-center gap-2.5 text-xs" style={{ color: 'var(--muted)' }}>
              {article.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  {formatNorwegianDate(article.publishedAt, 'short')}
                </span>
              )}
              <span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {article.readMinutes} min lesing
              </span>
            </div>

            <Link href={`/artikkel/${article.id}`} className="block">
              <h3
                className={`${
                  featured ? 'text-xl sm:text-2xl' : 'text-lg'
                } font-bold leading-snug group-hover:opacity-80 transition-opacity`}
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
              >
                {article.title}
              </h3>
            </Link>

            <p
              className={`${featured ? 'text-sm line-clamp-3' : 'text-xs sm:text-sm line-clamp-3'} leading-relaxed`}
              style={{ color: 'var(--muted)' }}
            >
              {extractExcerpt(article.content, featured ? 170 : 140)}
            </p>
          </div>
        </div>

        <div
          className="px-5 py-3 border-t flex items-center justify-between gap-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <Link
            href={`/artikkel/${article.id}`}
            className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 min-h-[44px] hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Les saken <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <BookmarkButton
            domain={SITE_CONFIG.displayDomain}
            article={bookmarkPayload}
            variant="icon"
          />
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Aktivt kategori-/søkefilter */}
      {isFiltered && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border text-sm ${cardRadius}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {rawSearch ? (
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
            ) : (
              <FolderOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
            )}
            <span>
              {rawCategory && rawSearch ? (
                <>
                  Viser <strong>{articles.length}</strong> saker for «<strong>{rawSearch}</strong>» i{' '}
                  <strong style={{ color: 'var(--accent)' }}>{rawCategory}</strong>
                </>
              ) : rawCategory ? (
                <>
                  Viser <strong>{articles.length}</strong> saker i kategorien{' '}
                  <strong style={{ color: 'var(--accent)' }}>{rawCategory}</strong>
                </>
              ) : (
                <>
                  Søkeresultater for «<strong>{rawSearch}</strong>» ({articles.length} treff)
                </>
              )}
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-full border text-xs font-bold uppercase tracking-wider shrink-0 transition-colors hover:opacity-85"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--ink)',
            }}
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Nullstill filter
          </Link>
        </div>
      )}

      {/* Top Banner Ad Slot */}
      {adsEnabled && (
        <AdBanner ads={ads} slotId="front_top" adsEnabled={adsEnabled} className="mb-4" />
      )}

      {articles.length === 0 ? (
        <div
          className={`text-center py-14 sm:py-16 px-6 border border-dashed max-w-2xl mx-auto space-y-5 ${cardRadius}`}
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <img
            src={SITE_CONFIG.heroImage}
            alt={SITE_CONFIG.heroAlt}
            width={1200}
            height={675}
            fetchPriority="high"
            loading="eager"
            className="w-full aspect-[16/9] max-h-72 object-cover rounded-lg"
          />
          <Compass
            className="w-10 h-10 mx-auto opacity-80"
            style={{ color: 'var(--accent)' }}
            aria-hidden="true"
          />
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
          >
            {isFiltered ? 'Ingen treff på valgt filter' : `Velkommen til ${SITE_CONFIG.siteName}`}
          </h1>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
            {rawSearch
              ? `Vi fant ingen publiserte saker som matcher «${rawSearch}». Prøv et annet søkeord eller utforsk alle saker på forsiden.`
              : rawCategory
              ? `Det er foreløpig ingen publiserte saker i kategorien «${rawCategory}». Prøv en annen seksjon eller gå tilbake til forsiden.`
              : `Redaksjonen klargjør nye fagartikler og analyser for ${SITE_CONFIG.displayDomain}. Kom tilbake snart for ferskt redaksjonelt innhold.`}
          </p>
          {isFiltered && (
            <Link
              href="/"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full"
              style={{ backgroundColor: 'var(--accent)', color: accentInk }}
            >
              Nullstill filter
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {/* 1. HERO STORY */}
          {heroArticle && renderHeroCard(heroArticle)}

          {/* 2. SECONDARY FEATURE STRIP ("Redaksjonens utvalgte") */}
          {featuredStrip.length > 0 && (
            <section aria-labelledby="redaksjonens-utvalgte" className="space-y-5">
              <div
                className="flex items-center justify-between gap-4 border-b-2 pb-2.5"
                style={{ borderColor: 'var(--ink)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  <h2
                    id="redaksjonens-utvalgte"
                    className="text-lg sm:text-xl font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                  >
                    Redaksjonens utvalgte
                  </h2>
                </div>
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted)' }}
                >
                  Utvalgt innsikt
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredStrip.map((item) => (
                  <React.Fragment key={item.id}>{renderArticleCard(item, true)}</React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* 3. MAIN FEED + EDITORIAL SIDEBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-6">
              {adsEnabled && feedArticles.length > 1 && (
                <AdBanner ads={ads} slotId="front_feed_3" adsEnabled={adsEnabled} />
              )}

              {feedArticles.length > 0 && (
                <section aria-labelledby="flere-saker" className="space-y-5">
                  <div
                    className="flex items-center justify-between gap-4 border-b pb-2.5"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <h2
                      id="flere-saker"
                      className="text-lg sm:text-xl font-bold tracking-tight"
                      style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                    >
                      {isFiltered ? 'Flere treff' : 'Siste fra redaksjonen'}
                    </h2>
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                      {feedArticles.length} {feedArticles.length === 1 ? 'sak' : 'saker'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {feedArticles.map((article, index) => (
                      <React.Fragment key={article.id}>
                        {renderArticleCard(article, false)}

                        {adsEnabled && index === 3 && (
                          <div className="sm:col-span-2">
                            <AdBanner
                              ads={ads}
                              slotId="front_feed_6"
                              adsEnabled={adsEnabled}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Editorial Sidebar */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Mest aktuelt (01-05) */}
              <div
                className={`border p-6 ${cardRadius}`}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="border-b-2 pb-2.5 mb-4 flex items-center justify-between"
                  style={{ borderColor: 'var(--ink)' }}
                >
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                  >
                    Mest aktuelt
                  </h2>
                  <span
                    className="text-[11px] uppercase font-bold tracking-widest"
                    style={{ color: 'var(--accent)' }}
                  >
                    Topp 5
                  </span>
                </div>

                <ol className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {latestSidebar.map((item, idx) => (
                    <li key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                      <Link
                        href={`/artikkel/${item.id}`}
                        className="group flex items-start gap-3.5 min-h-[44px]"
                      >
                        <span
                          className="font-mono text-sm font-black shrink-0 mt-0.5 tabular-nums"
                          style={{ color: 'var(--accent)' }}
                        >
                          0{idx + 1}
                        </span>
                        <div className="space-y-1 min-w-0">
                          <span
                            className="block text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--muted)' }}
                          >
                            {item.category}
                          </span>
                          <h3
                            className="text-sm font-bold leading-snug group-hover:underline"
                            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                          >
                            {item.title}
                          </h3>
                          <div
                            className="flex items-center gap-2 text-xs"
                            style={{ color: 'var(--muted)' }}
                          >
                            <span>{formatNorwegianDate(item.publishedAt, 'short')}</span>
                            <span aria-hidden="true">•</span>
                            <span>{item.readMinutes} min lesing</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Utforsk seksjoner med antall saker */}
              <div
                className={`border p-6 ${cardRadius}`}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="border-b pb-2.5 mb-4 flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <h2
                    className="text-base font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                  >
                    Utforsk seksjoner
                  </h2>
                  <FolderOpen
                    className="w-4 h-4"
                    style={{ color: 'var(--accent)' }}
                    aria-hidden="true"
                  />
                </div>

                <ul className="space-y-1.5">
                  {categoryCounts.map((cat) => {
                    const isSelected = categoryFilter === cat.name.toLowerCase();
                    return (
                      <li key={cat.name}>
                        <Link
                          href={`/?kategori=${encodeURIComponent(cat.name)}`}
                          className="flex items-center justify-between gap-3 px-3.5 min-h-[44px] rounded-lg border text-sm font-semibold transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg)',
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            color: isSelected ? 'var(--accent)' : 'var(--ink)',
                          }}
                        >
                          <span>{cat.name}</span>
                          <span
                            className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full text-xs font-bold tabular-nums"
                            style={{
                              backgroundColor: isSelected ? 'var(--accent)' : 'var(--surface)',
                              color: isSelected ? accentInk : 'var(--muted)',
                            }}
                          >
                            {cat.count}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Om magasinet (WCAG AA-sikret på både mørk og lys headerBg) */}
              <div
                className={`p-6 border border-t-4 ${cardRadius}`}
                style={{
                  backgroundColor: 'var(--header-bg)',
                  color: 'var(--header-ink)',
                  borderColor: aboutBorder,
                  borderTopColor: 'var(--accent)',
                }}
              >
                <span
                  className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm mb-3"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  Redaksjonen
                </span>
                <h2
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--header-ink)' }}
                >
                  Om {SITE_CONFIG.siteName}
                </h2>
                <p
                  className="text-xs sm:text-sm leading-relaxed mb-4"
                  style={{ color: aboutSecondaryText }}
                >
                  {SITE_CONFIG.aboutText}
                </p>
                <div
                  className="pt-3 border-t text-xs"
                  style={{ borderColor: aboutBorder, color: aboutSecondaryText }}
                >
                  Tips redaksjonen:{' '}
                  <a
                    href={`mailto:${SITE_CONFIG.tipsEmail}`}
                    className="underline font-semibold hover:opacity-85"
                    style={{ color: 'var(--header-ink)' }}
                  >
                    {SITE_CONFIG.tipsEmail}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Bottom Ad Banner Slot */}
      {adsEnabled && (
        <AdBanner
          ads={ads}
          slotId="front_bottom"
          adsEnabled={adsEnabled}
          className="mt-10"
        />
      )}
    </div>
  );
}

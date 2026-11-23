'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { getContrastInk, isDarkHex } from '@/lib/articleMeta';
import { OPEN_SEARCH_EVENT } from '@/components/MobileAppShell';

interface HeaderProps {
  activeCategory?: string;
}

function DesktopSearchForm({
  initialQuery,
  darkSurface,
  roundedClass = 'rounded-lg',
}: {
  initialQuery: string;
  darkSurface: boolean;
  roundedClass?: string;
}) {
  return (
    <form
      action="/"
      method="get"
      role="search"
      aria-label={`Søk i ${SITE_CONFIG.siteName}`}
      className="relative flex items-center w-56 xl:w-64 shrink-0"
    >
      <label htmlFor="desktop-site-search" className="sr-only">
        Søk i artikler
      </label>
      <input
        id="desktop-site-search"
        type="search"
        name="sok"
        defaultValue={initialQuery}
        placeholder="Søk i magasinet…"
        className={`w-full min-h-[40px] pl-3.5 pr-10 text-xs border transition-colors ${roundedClass}`}
        style={{
          backgroundColor: darkSurface ? 'rgba(255, 255, 255, 0.1)' : 'var(--bg)',
          borderColor: darkSurface ? 'rgba(255, 255, 255, 0.24)' : 'var(--border)',
          color: darkSurface ? 'var(--header-ink)' : 'var(--ink)',
        }}
      />
      <button
        type="submit"
        aria-label="Søk"
        className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-md hover:opacity-80"
        style={{ color: darkSurface ? 'var(--header-ink)' : 'var(--muted)' }}
      >
        <Search className="w-4 h-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function MobileAppHeader({
  currentCategory,
  accentInk,
}: {
  currentCategory: string;
  accentInk: string;
}) {
  const { siteName, shortMark, displayDomain, categories, layoutVariant, theme } = SITE_CONFIG;
  const useHeaderPalette =
    layoutVariant === 'modern-tech' || layoutVariant === 'bold-magazine';
  const isDarkMobile = useHeaderPalette && isDarkHex(theme.headerBg);

  const openSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
    }
  };

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-xl lg:hidden"
      style={{
        borderColor: isDarkMobile ? 'rgba(255,255,255,0.14)' : 'var(--border)',
        color: useHeaderPalette ? 'var(--header-ink)' : 'var(--ink)',
      }}
    >
      <div
        className="absolute inset-0 -z-10 opacity-[0.94]"
        style={{
          backgroundColor: useHeaderPalette ? 'var(--header-bg)' : 'var(--surface)',
        }}
        aria-hidden="true"
      />

      {/* Compact Top App Row (~60px) */}
      <div className="flex items-center justify-between gap-3 px-4 h-[60px]">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-h-[44px] min-w-0 group"
        >
          <span
            className={`inline-flex items-center justify-center w-9 h-9 text-xs font-black tracking-wider shrink-0 ${
              layoutVariant === 'modern-tech'
                ? 'rounded-lg'
                : layoutVariant === 'editorial-grid'
                ? 'rounded-full'
                : 'rounded-sm'
            }`}
            style={{
              backgroundColor: 'var(--accent)',
              color: accentInk,
            }}
          >
            {shortMark}
          </span>
          <div className="min-w-0">
            <span
              className={`block text-lg font-black leading-none truncate ${
                layoutVariant === 'classic-newspaper' ? 'uppercase tracking-tight' : 'tracking-tight'
              }`}
              style={{
                fontFamily: 'var(--font-heading)',
                color: useHeaderPalette ? 'var(--header-ink)' : 'var(--ink)',
              }}
            >
              {siteName}
            </span>
            <span
              className="block text-[11px] leading-tight mt-0.5 truncate opacity-75"
              style={{
                color: useHeaderPalette ? 'var(--header-ink)' : 'var(--muted)',
              }}
            >
              {displayDomain}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={openSearch}
          aria-label="Søk i magasinet"
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border shrink-0 transition-opacity active:opacity-75"
          style={{
            backgroundColor: isDarkMobile ? 'rgba(255,255,255,0.1)' : 'var(--bg)',
            borderColor: isDarkMobile ? 'rgba(255,255,255,0.22)' : 'var(--border)',
            color: useHeaderPalette ? 'var(--header-ink)' : 'var(--ink)',
          }}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Horizontally Scrollable Category Pill Bar */}
      <nav
        aria-label="Kategorier"
        className="border-t overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{
          borderColor: isDarkMobile ? 'rgba(255,255,255,0.12)' : 'var(--border)',
          backgroundColor: useHeaderPalette
            ? isDarkMobile
              ? 'rgba(0,0,0,0.18)'
              : 'var(--bg)'
            : 'var(--bg)',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-1.5 w-max">
          <Link
            href="/"
            aria-current={!currentCategory ? 'page' : undefined}
            className="snap-start inline-flex items-center justify-center min-h-[44px] px-4 rounded-full text-xs font-bold whitespace-nowrap border transition-colors"
            style={{
              backgroundColor: !currentCategory
                ? 'var(--accent)'
                : isDarkMobile
                ? 'rgba(255,255,255,0.08)'
                : 'var(--surface)',
              borderColor: !currentCategory
                ? 'var(--accent)'
                : isDarkMobile
                ? 'rgba(255,255,255,0.2)'
                : 'var(--border)',
              color: !currentCategory
                ? accentInk
                : useHeaderPalette
                ? 'var(--header-ink)'
                : 'var(--ink)',
            }}
          >
            Alle
          </Link>
          {categories.map((category) => {
            const isActive = currentCategory.toLowerCase() === category.toLowerCase();
            return (
              <Link
                key={category}
                href={`/?kategori=${encodeURIComponent(category)}`}
                aria-current={isActive ? 'page' : undefined}
                className="snap-start inline-flex items-center justify-center min-h-[44px] px-4 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'var(--accent)'
                    : isDarkMobile
                    ? 'rgba(255,255,255,0.08)'
                    : 'var(--surface)',
                  borderColor: isActive
                    ? 'var(--accent)'
                    : isDarkMobile
                    ? 'rgba(255,255,255,0.2)'
                    : 'var(--border)',
                  color: isActive
                    ? accentInk
                    : useHeaderPalette
                    ? 'var(--header-ink)'
                    : 'var(--ink)',
                }}
              >
                {category}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

function DesktopHeader({
  currentCategory,
  currentSearch,
  accentInk,
}: {
  currentCategory: string;
  currentSearch: string;
  accentInk: string;
}) {
  const today = new Date().toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { siteName, shortMark, displayDomain, tagline, categories, layoutVariant, theme } =
    SITE_CONFIG;
  const headerIsDark = isDarkHex(theme.headerBg);
  const subtleHeaderBorder = headerIsDark ? 'rgba(255,255,255,0.16)' : 'var(--border)';

  if (layoutVariant === 'modern-tech') {
    return (
      <header
        className="hidden lg:block border-b sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--header-bg)',
          color: 'var(--header-ink)',
          borderColor: subtleHeaderBorder,
        }}
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 py-3.5">
            <Link href="/" className="flex items-center gap-3 min-h-[44px] shrink-0 group">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black tracking-tight shrink-0"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {shortMark}
              </span>
              <div>
                <span
                  className="block text-2xl font-bold tracking-tight leading-none"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--header-ink)' }}
                >
                  {siteName}
                </span>
                <span className="block text-[11px] opacity-80 mt-0.5">{displayDomain}</span>
              </div>
            </Link>

            <nav aria-label="Hovedkategorier" className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <Link
                href="/"
                aria-current={!currentCategory ? 'page' : undefined}
                className="min-h-[44px] px-3.5 flex items-center text-xs font-semibold rounded-lg transition-opacity hover:opacity-85 whitespace-nowrap"
                style={{
                  backgroundColor: !currentCategory ? 'var(--accent)' : 'transparent',
                  color: !currentCategory ? accentInk : 'var(--header-ink)',
                }}
              >
                Forside
              </Link>
              {categories.map((category) => {
                const isActive = currentCategory.toLowerCase() === category.toLowerCase();
                return (
                  <Link
                    key={category}
                    href={`/?kategori=${encodeURIComponent(category)}`}
                    aria-current={isActive ? 'page' : undefined}
                    className="min-h-[44px] px-3.5 flex items-center text-xs font-medium rounded-lg transition-opacity hover:opacity-85 whitespace-nowrap"
                    style={{
                      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? accentInk : 'var(--header-ink)',
                    }}
                  >
                    {category}
                  </Link>
                );
              })}
            </nav>

            <DesktopSearchForm
              initialQuery={currentSearch}
              darkSurface={headerIsDark}
              roundedClass="rounded-lg"
            />
          </div>
        </div>
      </header>
    );
  }

  if (layoutVariant === 'editorial-grid') {
    return (
      <header
        className="hidden lg:block border-b"
        style={{
          backgroundColor: 'var(--surface)',
          color: 'var(--ink)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="border-b py-2 text-xs"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
            color: 'var(--muted)',
          }}
        >
          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 flex justify-between items-center gap-4">
            <span className="capitalize" suppressHydrationWarning>
              {today}
            </span>
            <span className="font-semibold tracking-wide">{displayDomain}</span>
          </div>
        </div>

        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 py-6 space-y-5">
          <div className="flex items-end justify-between gap-6">
            <Link href="/" className="inline-block group min-h-[44px]">
              <div className="flex items-center gap-3.5">
                <span
                  className="w-2.5 h-10 rounded-sm shrink-0"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
                <span
                  className="text-4xl xl:text-5xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  {siteName}
                </span>
              </div>
              <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--muted)' }}>
                {tagline}
              </p>
            </Link>

            <DesktopSearchForm
              initialQuery={currentSearch}
              darkSurface={false}
              roundedClass="rounded-full"
            />
          </div>

          <nav
            aria-label="Hovedkategorier"
            className="flex items-center gap-2 pt-3 border-t overflow-x-auto scrollbar-hide"
            style={{ borderColor: 'var(--border)' }}
          >
            <Link
              href="/"
              aria-current={!currentCategory ? 'page' : undefined}
              className="min-h-[44px] px-4 flex items-center text-xs font-semibold rounded-full border whitespace-nowrap transition-colors"
              style={{
                backgroundColor: !currentCategory ? 'var(--accent)' : 'var(--bg)',
                borderColor: !currentCategory ? 'var(--accent)' : 'var(--border)',
                color: !currentCategory ? accentInk : 'var(--ink)',
              }}
            >
              Forside
            </Link>
            {categories.map((category) => {
              const isActive = currentCategory.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?kategori=${encodeURIComponent(category)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-h-[44px] px-4 flex items-center text-xs font-semibold rounded-full border whitespace-nowrap transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: isActive ? 'var(--accent)' : 'var(--bg)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    color: isActive ? accentInk : 'var(--ink)',
                  }}
                >
                  {category}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  if (layoutVariant === 'bold-magazine') {
    return (
      <header
        className="hidden lg:block"
        style={{ backgroundColor: 'var(--header-bg)', color: 'var(--header-ink)' }}
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 pb-2">
          <div
            className="flex items-center justify-between gap-6 border-b pb-5"
            style={{ borderColor: subtleHeaderBorder }}
          >
            <Link href="/" className="inline-flex items-center gap-3.5 min-h-[44px]">
              <span
                className="inline-flex items-center justify-center px-3 py-2 text-sm font-black tracking-wider rounded-sm"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {shortMark}
              </span>
              <div>
                <span
                  className="block text-4xl font-black tracking-tight leading-none"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--header-ink)' }}
                >
                  {siteName}
                </span>
                <span className="block text-xs opacity-80 mt-1">{tagline}</span>
              </div>
            </Link>

            <div className="flex items-center gap-5 shrink-0">
              <div className="text-xs opacity-85 text-right hidden xl:block">
                <span className="block capitalize" suppressHydrationWarning>
                  {today}
                </span>
                <span className="font-semibold">{displayDomain}</span>
              </div>
              <DesktopSearchForm
                initialQuery={currentSearch}
                darkSurface={headerIsDark}
                roundedClass="rounded-sm"
              />
            </div>
          </div>

          <nav
            aria-label="Hovedkategorier"
            className="pt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide"
          >
            <Link
              href="/"
              aria-current={!currentCategory ? 'page' : undefined}
              className="min-h-[44px] px-3.5 flex items-center text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-[3px] transition-opacity"
              style={{
                borderColor: !currentCategory ? 'var(--accent)' : 'transparent',
                color: 'var(--header-ink)',
                opacity: !currentCategory ? 1 : 0.85,
              }}
            >
              Forside
            </Link>
            {categories.map((category) => {
              const isActive = currentCategory.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?kategori=${encodeURIComponent(category)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-h-[44px] px-3.5 flex items-center text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-[3px] transition-opacity hover:opacity-100"
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                    color: 'var(--header-ink)',
                    opacity: isActive ? 1 : 0.85,
                  }}
                >
                  {category}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  // Standard: 'classic-newspaper'
  return (
    <header
      className="hidden lg:block border-b"
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        color: 'var(--ink)',
      }}
    >
      {/* Top Utility Bar */}
      <div
        className="py-2 text-[11px] uppercase tracking-widest"
        style={{
          backgroundColor: 'var(--header-bg)',
          color: 'var(--header-ink)',
        }}
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 flex justify-between items-center">
          <span className="capitalize" suppressHydrationWarning>
            {today}
          </span>
          <span className="font-semibold opacity-95">{displayDomain}</span>
        </div>
      </div>

      {/* Main Masthead */}
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 py-7 text-center">
        <Link href="/" className="inline-block group min-h-[44px]">
          <span
            className="block text-5xl xl:text-6xl font-black tracking-tight uppercase transition-opacity group-hover:opacity-85"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
          >
            {siteName}
          </span>
          <p className="text-sm mt-2 max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            {tagline}
          </p>
        </Link>
      </div>

      {/* Categories & Inline Search Bar */}
      <div
        className="border-t-2 border-b"
        style={{
          borderTopColor: 'var(--ink)',
          borderBottomColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-6">
          <nav
            aria-label="Hovedkategorier"
            className="flex items-center gap-5 text-xs font-bold uppercase tracking-wider whitespace-nowrap overflow-x-auto scrollbar-hide"
          >
            <Link
              href="/"
              aria-current={!currentCategory ? 'page' : undefined}
              className="min-h-[48px] px-2 flex items-center border-b-2 transition-colors"
              style={{
                borderColor: !currentCategory ? 'var(--accent)' : 'transparent',
                color: !currentCategory ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              Forside
            </Link>
            {categories.map((category) => {
              const isActive = currentCategory.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?kategori=${encodeURIComponent(category)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-h-[48px] px-2 flex items-center border-b-2 transition-colors hover:opacity-80"
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--ink)',
                  }}
                >
                  {category}
                </Link>
              );
            })}
          </nav>

          <div className="py-1.5">
            <DesktopSearchForm
              initialQuery={currentSearch}
              darkSurface={false}
              roundedClass="rounded-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderInner({ activeCategory }: HeaderProps) {
  const searchParams = useSearchParams();
  const currentCategory = activeCategory ?? searchParams?.get('kategori') ?? '';
  const currentSearch = searchParams?.get('sok') ?? '';
  const accentInk = getContrastInk(SITE_CONFIG.theme.accent);

  return (
    <>
      <MobileAppHeader currentCategory={currentCategory} accentInk={accentInk} />
      <DesktopHeader
        currentCategory={currentCategory}
        currentSearch={currentSearch}
        accentInk={accentInk}
      />
    </>
  );
}

function HeaderFallback({ activeCategory }: HeaderProps) {
  const accentInk = getContrastInk(SITE_CONFIG.theme.accent);
  const currentCategory = activeCategory ?? '';
  return (
    <>
      <MobileAppHeader currentCategory={currentCategory} accentInk={accentInk} />
      <DesktopHeader
        currentCategory={currentCategory}
        currentSearch=""
        accentInk={accentInk}
      />
    </>
  );
}

export default function Header({ activeCategory }: HeaderProps) {
  return (
    <Suspense fallback={<HeaderFallback activeCategory={activeCategory} />}>
      <HeaderInner activeCategory={activeCategory} />
    </Suspense>
  );
}

import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { getContrastInk, isDarkHex } from '@/lib/articleMeta';
import ReaderStrip from '@/components/ReaderStrip';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const {
    siteName,
    shortMark,
    aboutText,
    categories,
    editorialEmail,
    tipsEmail,
    publisherLegalName,
    displayDomain,
    layoutVariant,
    theme,
  } = SITE_CONFIG;

  const useHeaderSurface =
    layoutVariant === 'modern-tech' || layoutVariant === 'bold-magazine';
  const darkSurface = useHeaderSurface && isDarkHex(theme.headerBg);
  const accentInk = getContrastInk(theme.accent);

  const primaryText = useHeaderSurface ? 'var(--header-ink)' : 'var(--ink)';
  const secondaryText = darkSurface ? 'rgba(255, 255, 255, 0.84)' : 'var(--muted)';
  const subtleBorder = darkSurface ? 'rgba(255, 255, 255, 0.16)' : 'var(--border)';

  return (
    <footer
      className="border-t mt-16 py-12"
      style={{
        backgroundColor: useHeaderSurface ? 'var(--header-bg)' : 'var(--surface)',
        color: primaryText,
        borderColor: subtleBorder,
      }}
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8 border-b"
          style={{ borderColor: subtleBorder }}
        >
          {/* Kolonne 1: Om magasinet */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-black shrink-0"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {shortMark}
              </span>
              <span
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', color: primaryText }}
              >
                {siteName}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: secondaryText }}>
              {aboutText}
            </p>
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: secondaryText }}>
              <Newspaper className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{displayDomain}</span>
            </p>
            <ReaderStrip />
          </div>

          {/* Kolonne 2: Seksjoner og lenker */}
          <div className="space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: secondaryText, fontFamily: 'var(--font-body)' }}
            >
              Seksjoner
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-0.5 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center min-h-[44px] hover:underline"
                  style={{ color: primaryText }}
                >
                  Forside og siste saker
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?kategori=${encodeURIComponent(cat)}`}
                    className="inline-flex items-center min-h-[44px] hover:underline"
                    style={{ color: primaryText }}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolonne 3: Redaksjon & Personvern */}
          <div className="space-y-3">
            <h2
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: secondaryText, fontFamily: 'var(--font-body)' }}
            >
              Redaksjon og personvern
            </h2>
            <div className="text-sm space-y-2" style={{ color: secondaryText }}>
              <p className="font-semibold" style={{ color: primaryText }}>
                {publisherLegalName}
              </p>
              <p>
                Redaksjonen:{' '}
                <a
                  href={`mailto:${editorialEmail}`}
                  className="underline hover:opacity-80 font-medium"
                  style={{ color: darkSurface ? 'var(--header-ink)' : 'var(--accent)' }}
                >
                  {editorialEmail}
                </a>
              </p>
              <p>
                Tips og innspill:{' '}
                <a
                  href={`mailto:${tipsEmail}`}
                  className="underline hover:opacity-80 font-medium"
                  style={{ color: darkSurface ? 'var(--header-ink)' : 'var(--accent)' }}
                >
                  {tipsEmail}
                </a>
              </p>
              <p className="pt-1">
                <Link
                  href="/personvern"
                  className="inline-flex items-center min-h-[44px] underline hover:opacity-80 font-medium"
                  style={{ color: primaryText }}
                >
                  Personvernerklæring
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bunntekst */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ color: secondaryText }}
        >
          <p className="text-center sm:text-left">
            © {currentYear} {publisherLegalName}. Alle rettigheter reservert. · Utviklet av{' '}
            <a
              href="https://vikingnet.no"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 font-semibold"
              style={{ color: primaryText }}
            >
              Vikingnet
            </a>
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/personvern"
              className="hover:underline min-h-[44px] inline-flex items-center"
              style={{ color: primaryText }}
            >
              Personvern
            </Link>
            <Link
              href="/sitemap.xml"
              className="hover:underline min-h-[44px] inline-flex items-center"
              style={{ color: primaryText }}
            >
              Sidekart
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Megaphone } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { getContrastInk } from '@/lib/articleMeta';

export const metadata: Metadata = {
  title: 'Annonsering og kommersielt samarbeid',
  description: `Informasjon om kommersielle fagartikler, bransjesynlighet og samarbeid i ${SITE_CONFIG.siteName} (${SITE_CONFIG.displayDomain}).`,
  alternates: {
    canonical: `https://${SITE_CONFIG.displayDomain}/annonsering`,
  },
};

export default function AdvertisingPage() {
  const { siteName, displayDomain, categories, editorialEmail, theme } = SITE_CONFIG;
  const accentInk = getContrastInk(theme.accent);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div
        className="flex items-center justify-between border-b pb-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider min-h-[44px] hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {displayDomain}
        </span>
      </div>

      <article
        className="border p-6 sm:p-10 rounded-sm space-y-6"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <header className="space-y-2 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            <Megaphone className="w-4 h-4" />
            Annonsering og kommersielt samarbeid
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
          >
            Synlighet for din bedrift i {siteName}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {siteName} publiserer daglig fagstoff innen {categories.join(', ').toLowerCase()}, og er
            en del av et nettverk av 16 norske bransjemagasiner.
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Kommersielle fagartikler som blir stående
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            Bedrifter som ønsker sterkere synlighet i både Google og AI-søk kan publisere
            skreddersydde, kommersielle fagartikler i {siteName}. Vi tar oss av research, skriving
            på naturlig norsk bokmål og publisering – med permanent lenke tilbake til nettsiden
            deres.
          </p>
          <ul className="space-y-2 pt-1" style={{ color: 'var(--muted)' }}>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span>Løpende fagartikler publisert i riktig bransje – uten oppstartsgebyr eller bindingstid.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span>Permanent plassering og lenke til bedriftens nettside, fra 990 kr/mnd eks. mva.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span>Enkel bestilling med Stripe eller EHF-faktura, samt ryddig kommersiell merking etter markedsføringsloven.</span>
            </li>
          </ul>
        </section>

        <section
          className="border-t pt-6 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <a
            href="https://digitalpr.no/priser"
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm text-sm font-bold min-h-[44px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: accentInk }}
          >
            Se pakker og bestill samarbeid
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <a
            href={`mailto:${editorialEmail}?subject=${encodeURIComponent(`Kommersielt samarbeid i ${siteName}`)}`}
            className="inline-flex items-center justify-center px-4 py-3 text-sm font-semibold underline min-h-[44px] hover:opacity-80"
            style={{ color: 'var(--ink)' }}
          >
            Kontakt oss på {editorialEmail}
          </a>
        </section>
      </article>
    </div>
  );
}

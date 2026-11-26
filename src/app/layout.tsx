import Script from 'next/script';
import './globals.css';
import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileAppShell from '@/components/MobileAppShell';
import { SITE_CONFIG } from '@/config/site';
import { getContrastInk } from '@/lib/articleMeta';

const headingFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading-google',
  display: 'swap',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-google',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: SITE_CONFIG.theme.headerBg,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  metadataBase: new URL(`https://${SITE_CONFIG.displayDomain}`),
  alternates: { canonical: '/' },
  title: {
    default: `${SITE_CONFIG.siteName} – ${SITE_CONFIG.categories.slice(0, 3).join(', ')}`,
    template: `%s | ${SITE_CONFIG.siteName}`,
  },
  description: SITE_CONFIG.description,
  icons: {
    icon: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    title: SITE_CONFIG.siteName,
    statusBarStyle: 'default',
  },
  openGraph: {
    title: SITE_CONFIG.siteName,
    description: SITE_CONFIG.description,
    url: `https://${SITE_CONFIG.displayDomain}`,
    siteName: SITE_CONFIG.siteName,
    locale: 'nb_NO',
    type: 'website',
    images: [
      {
        url: SITE_CONFIG.heroImage,
        width: 1200,
        height: 675,
        alt: SITE_CONFIG.heroAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.siteName,
    description: SITE_CONFIG.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = SITE_CONFIG;
  const accentInk = getContrastInk(theme.accent);
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID?.trim();

  const themeVars = {
    '--bg': theme.bg,
    '--surface': theme.surface,
    '--ink': theme.ink,
    '--muted': theme.muted,
    '--accent': theme.accent,
    '--accent-soft': theme.accentSoft,
    '--border': theme.border,
    '--header-bg': theme.headerBg,
    '--header-ink': theme.headerInk,
    '--font-heading': 'var(--font-heading-google), Georgia, serif',
    '--font-body': 'var(--font-body-google), system-ui, sans-serif',
  } as React.CSSProperties;

  return (
    <html lang="nb" className={`${headingFont.variable} ${bodyFont.variable}`} style={themeVars}>
      <body
        className="min-h-screen flex flex-col antialiased pb-24 lg:pb-0"
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <a
          href="#hovedinnhold"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-bold"
          style={{ backgroundColor: 'var(--accent)', color: accentInk }}
        >
          Hopp til hovedinnhold
        </a>

        <Header />

        <main
          id="hovedinnhold"
          className="flex-1 max-w-7xl 2xl:max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10"
        >
          {children}
        </main>

        <Footer />

        <Suspense fallback={null}>
          <MobileAppShell
            siteName={SITE_CONFIG.siteName}
            shortMark={SITE_CONFIG.shortMark}
            displayDomain={SITE_CONFIG.displayDomain}
            categories={SITE_CONFIG.categories}
            tipsEmail={SITE_CONFIG.tipsEmail}
            accentInk={accentInk}
          />
        </Suspense>

        {ga4Id ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga4Id)});`,
              }}
            />
          </>
        ) : null}
        {/*
          Strukturdata: hvem som står bak magasinet, og at domenet er et nettsted.
          Samme opplysning som footeren. WebSite-noden er ikke pynt: uten en
          sidetype i grafen har en AI-crawler ingen entitet å feste siden til.
          Målt 23.11.2026: tolv magasiner emitterte bare Organization, og
          ai-synlighet.mjs meldte «schema: mangler sidetype» på alle tolv.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `https://${SITE_CONFIG.displayDomain}/#organisasjon`,
                  name: SITE_CONFIG.siteName,
                  legalName: 'AIChat Norge AS',
                  url: `https://${SITE_CONFIG.displayDomain}`,
                  email: SITE_CONFIG.editorialEmail,
                  identifier: {
                    '@type': 'PropertyValue',
                    name: 'Organisasjonsnummer',
                    value: '933 851 222',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': `https://${SITE_CONFIG.displayDomain}/#nettsted`,
                  url: `https://${SITE_CONFIG.displayDomain}`,
                  name: SITE_CONFIG.siteName,
                  inLanguage: 'nb-NO',
                  publisher: { '@id': `https://${SITE_CONFIG.displayDomain}/#organisasjon` },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}

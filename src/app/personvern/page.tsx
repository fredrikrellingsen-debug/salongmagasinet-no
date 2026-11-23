import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'Personvernerklæring',
  description: `Personvernerklæring for ${SITE_CONFIG.siteName} (${SITE_CONFIG.displayDomain}). Informasjon om behandling av personopplysninger og dine rettigheter etter GDPR.`,
  alternates: {
    canonical: `https://${SITE_CONFIG.displayDomain}/personvern`,
  },
};

export default function PrivacyPage() {
  const { siteName, displayDomain, editorialEmail, publisherLegalName } = SITE_CONFIG;

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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Shield className="w-4 h-4" />
            Personvern og informasjonskapsler
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
          >
            Personvernerklæring for {siteName}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Sist oppdatert: {new Date().toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })}
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            1. Behandlingsansvarlig
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            {publisherLegalName} er behandlingsansvarlig for personopplysninger som samles inn via{' '}
            <strong>{displayDomain}</strong>. Vi behandler alle personopplysninger i samsvar med norsk
            personopplysningslov og EUs personvernforordning (GDPR).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            2. Hvilke opplysninger vi behandler
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            Du kan lese artikler på {siteName} uten å oppgi personopplysninger. Dersom du frivillig fyller
            ut et kontaktskjema i tilknytning til en fagartikkel, behandler vi opplysningene du selv oppgir:
          </p>
          <ul className="list-disc pl-5 space-y-1.5" style={{ color: 'var(--muted)' }}>
            <li>Fullt navn og e-postadresse (påkrevd for å kunne svare deg).</li>
            <li>Telefonnummer og eventuell meldingstekst (valgfritt).</li>
            <li>Nettadressen til artikkelen henvendelsen ble sendt fra.</li>
          </ul>
          <p style={{ color: 'var(--muted)' }}>
            Formålet med behandlingen (rettslig grunnlag: GDPR artikkel 6 nr. 1 bokstav a og b) er å
            formidle din forespørsel direkte til den aktuelle fagkilden eller bedriften du ønsker kontakt med.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            3. Informasjonskapsler (cookies) og sporing
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            {siteName} benytter ingen tredjeparts sporingscookies, atferdsbasert annonsering eller
            eksterne analyseverktøy som sporer deg på tvers av nettsteder. Det settes kun teknisk nødvendige
            server- eller sikkerhetsmekanismer for sikker drift og beskyttelse mot misbruk.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            4. Lagringstid og sikkerhet
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            Henvendelser som sendes inn via kontaktskjema lagres trygt med kryptert overføring (HTTPS) og
            slettes når de ikke lenger er nødvendige for å oppfylle formålet med henvendelsen, eller når du
            ber om sletting.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            5. Dine rettigheter og kontaktinformasjon
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            Du har rett til å be om innsyn i, retting av eller sletting av personopplysninger vi har
            lagret om deg, samt rett til å begrense behandlingen. Du kan når som helst kontakte redaksjonen på{' '}
            <a
              href={`mailto:${editorialEmail}`}
              className="underline font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {editorialEmail}
            </a>
            . Dersom du mener vår behandling bryter med personvernregelverket, har du rett til å klage til
            Datatilsynet.
          </p>
        </section>
      </article>
    </div>
  );
}

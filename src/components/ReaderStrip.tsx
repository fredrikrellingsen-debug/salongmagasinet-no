import { SITE_CONFIG } from '@/config/site';

/**
 * Lesertall fra DigitalPR-huben.
 *
 * Magasinet regner aldri ut tallet selv: huben eier tallgrunnlaget, avrunder
 * det og avgjør om det kan publiseres. Under terskelen rendres ingenting – vi
 * viser aldri «0 lesere». Feiler kallet, rendres ingenting.
 *
 * Server-side med revalidate 3600: tallet står i HTML-en (søkbart og raskt),
 * og vi gjør ett oppslag i timen i stedet for ett per sidevisning.
 */

interface PortalTall {
  lesere: number | null;
  publisert: boolean;
  periode: { fra: string; til: string; dager: number } | null;
}

async function hentTall(): Promise<PortalTall | null> {
  try {
    const res = await fetch(
      `https://digitalpr.no/api/public/lesertall?domene=${encodeURIComponent(
        SITE_CONFIG.displayDomain
      )}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { portal?: PortalTall };
    return data.portal ?? null;
  } catch {
    return null;
  }
}

export default async function ReaderStrip() {
  const tall = await hentTall();
  if (!tall?.publisert || tall.lesere === null) return null;

  const dager = tall.periode?.dager ?? 30;

  return (
    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
      {tall.lesere.toLocaleString('nb-NO')} lesere siste {dager} dager
    </p>
  );
}

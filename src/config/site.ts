export type LayoutVariant =
  | 'classic-newspaper'
  | 'modern-tech'
  | 'editorial-grid'
  | 'bold-magazine';

export interface SiteTheme {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
  headerBg: string;
  headerInk: string;
  fontHeading: string;
  fontBody: string;
}

export interface SiteConfig {
  domain: string;
  displayDomain: string;
  siteName: string;
  shortMark: string;
  tagline: string;
  description: string;
  categories: string[];
  editorialEmail: string;
  tipsEmail: string;
  publisherLegalName: string;
  heroImage: string;
  heroAlt: string;
  layoutVariant: LayoutVariant;
  theme: SiteTheme;
  aboutText: string;
}

export function normalizeDomain(input?: string): string {
  if (!input) return "salongmagasinet.no";
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');

  if (!cleaned) return "salongmagasinet.no";

  try {
    return new URL(`https://${cleaned}`).hostname;
  } catch {
    return cleaned;
  }
}

export const SITE_CONFIG: SiteConfig = {
  domain: normalizeDomain(process.env.NEXT_PUBLIC_DOMAIN) || "salongmagasinet.no",
  displayDomain: "salongmagasinet.no",
  siteName: "Salongmagasinet",
  shortMark: "SM",
  tagline: "Guider, trender og fagstoff om frisør, hudpleie, velvære og salongbehandling",
  description: "Salongmagasinet er Norges redaksjonelle magasin for frisør, hudpleie, velvære og moderne salongbehandlinger – med faglige råd, trender og inspirasjon.",
  categories: ["Frisør & Hår", "Hudpleie", "Velvære & Spa", "Behandlinger", "Salongguider"],
  editorialEmail: "redaksjonen@salongmagasinet.no",
  tipsEmail: "tips@salongmagasinet.no",
  publisherLegalName: "Salongmagasinet Redaksjon",
  heroImage: '/images/hero.webp',
  heroAlt: "Moderne skandinavisk frisør- og hudpleiesalong med lyse eikedetaljer og dagslys",
  layoutVariant: "bold-magazine",
  theme: {
    bg: "#fdf8fa",
    surface: "#ffffff",
    ink: "#2a121f",
    muted: "#6b4c5e",
    accent: "#9d174d",
    accentSoft: "#fce7f3",
    border: "#f1dce6",
    headerBg: "#3b0724",
    headerInk: "#fdf2f8",
    fontHeading: "var(--font-heading-google), Georgia, serif",
    fontBody: "var(--font-body-google), system-ui, sans-serif",
  },
  aboutText: "Salongmagasinet skriver redaksjonelle guider og fagartikler om hårpleie, frisørtrender, profesjonell hudpleie, spa og salongbehandlinger i Norge.",
};

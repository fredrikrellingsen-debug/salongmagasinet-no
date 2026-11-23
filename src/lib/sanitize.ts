import { SITE_CONFIG } from '@/config/site';

const DANGEROUS_BLOCK_TAGS =
  /<(script|iframe|object|embed|style|noscript|form|svg)\b[^>]*>[\s\S]*?<\/\1>/gi;
const DANGEROUS_SELF_CLOSING_TAGS =
  /<(script|iframe|object|embed|style|noscript|meta|link|base|form|input|button|textarea|select)\b[^>]*\/?>/gi;
const EVENT_HANDLER_ATTRS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_PROTOCOLS =
  /(href|src|action|formaction|poster)\s*=\s*(?:"\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^']*'|(?:javascript|vbscript):[^\s>]+)/gi;
const EXTERNAL_STOCK_IMAGES =
  /https?:\/\/(?:images\.)?(?:unsplash|pexels)\.com\/[^\s"'<>)]+/gi;

/**
 * Renser artikkel-HTML før dangerouslySetInnerHTML for å hindre XSS og ekstern hotlinking.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let clean = html
    .replace(DANGEROUS_BLOCK_TAGS, '')
    .replace(DANGEROUS_SELF_CLOSING_TAGS, '')
    .replace(EVENT_HANDLER_ATTRS, '')
    .replace(DANGEROUS_PROTOCOLS, '$1="#"')
    .replace(EXTERNAL_STOCK_IMAGES, SITE_CONFIG.heroImage);

  // Sikre rel="noopener noreferrer" på eksterne lenker med target="_blank"
  clean = clean.replace(/<a\b([^>]*target\s*=\s*["']?_blank["']?[^>]*)>/gi, (match, attrs) => {
    if (/rel\s*=/i.test(attrs)) {
      return match;
    }
    return `<a${attrs} rel="noopener noreferrer">`;
  });

  // Gi bilder i artikkeltekst eksplisitt lazy loading og dekoding hvis det mangler
  clean = clean.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    let updated = attrs;
    if (!/\bloading\s*=/i.test(updated)) {
      updated += ' loading="lazy"';
    }
    if (!/\bdecoding\s*=/i.test(updated)) {
      updated += ' decoding="async"';
    }
    return `<img${updated}>`;
  });

  return clean;
}

/**
 * Sikrer at bilde-URLer på forsiden aldri hotlinker til eksterne arkivbilder (Unsplash/Pexels)
 * og alltid faller tilbake til lokalt hero-bilde ved ugyldig eller ekstern usikker sti.
 */
export function sanitizeImageSrc(src: string | null | undefined): string {
  if (!src) return SITE_CONFIG.heroImage;
  const trimmed = src.trim();
  if (!trimmed) return SITE_CONFIG.heroImage;

  if (EXTERNAL_STOCK_IMAGES.test(trimmed)) {
    EXTERNAL_STOCK_IMAGES.lastIndex = 0;
    return SITE_CONFIG.heroImage;
  }
  EXTERNAL_STOCK_IMAGES.lastIndex = 0;

  if (trimmed.startsWith('/images/')) {
    return trimmed;
  }

  return SITE_CONFIG.heroImage;
}

const INTERNAL_TAG_PREFIXES = [
  'org:',
  'kontakt:',
  'tlf:',
  'epost:',
  'faktura:',
  'http://',
  'https://',
  'www.',
];

const INTERNAL_TAG_EXACT = new Set([
  'basis',
  'vekst',
  'dominans',
  'standard',
  'pro',
  'tier1',
  'premium',
  'nasjonalt',
  'allround',
]);

/**
 * Filtrerer bort interne CRM/metadata-tags så kundens personopplysninger eller
 * abonnementstier aldri vises som offentlige merkelapper på artikkelsiden.
 */
export function filterPublicTags(tags: string[] | null | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  return tags
    .map((t) => t.trim())
    .filter((t) => {
      if (!t) return false;
      const lower = t.toLowerCase();
      if (INTERNAL_TAG_EXACT.has(lower)) return false;
      if (INTERNAL_TAG_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
      if (lower.includes('@')) return false;
      return true;
    })
    .slice(0, 6);
}

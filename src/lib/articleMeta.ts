export interface ArticleLike {
  title: string;
  content: string;
  customer?: {
    tags?: string[] | null;
  } | null;
}

const DATA_CATEGORY_BLOCK_REGEX =
  /<div\b[^>]*\bdata-category\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>[\s\S]*?<\/div>/i;
const DATA_CATEGORY_ATTR_REGEX =
  /<[a-z]+\b[^>]*\bdata-category\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/i;
const STRIP_DATA_CATEGORY_BLOCKS =
  /<div\b[^>]*\bdata-category\s*=[^>]*>[\s\S]*?<\/div>/gi;

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  const withoutMetaDivs = html.replace(STRIP_DATA_CATEGORY_BLOCKS, ' ');
  const withoutTags = withoutMetaDivs.replace(/<[^>]*>?/gm, ' ');
  return decodeBasicEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/**
 * Henter redaksjonell kategori for en artikkel:
 * 1) Leser <div data-category="..."> i innholdet dersom den finnes.
 * 2) Matcher mot nettstedets kategorier via tags, tittel og brødtekst.
 * 3) Faller tilbake til første kategori i SITE_CONFIG eller 'Aktuelt'.
 */
export function extractCategory(
  article: ArticleLike,
  siteCategories: string[]
): string {
  const safeCategories = Array.isArray(siteCategories)
    ? siteCategories.map((c) => c.trim()).filter(Boolean)
    : [];
  const fallback = safeCategories[0] || 'Aktuelt';

  const content = article?.content || '';
  const title = article?.title || '';
  const tags = article?.customer?.tags || [];

  // 1. Direkte data-category-attributt i artikkelinnholdet
  const blockMatch = content.match(DATA_CATEGORY_BLOCK_REGEX);
  const attrMatch = blockMatch || content.match(DATA_CATEGORY_ATTR_REGEX);
  const rawDataCategory = (attrMatch?.[1] || attrMatch?.[2] || attrMatch?.[3] || '').trim();

  if (rawDataCategory) {
    const decoded = decodeBasicEntities(rawDataCategory).trim();
    const canonical = safeCategories.find(
      (cat) => cat.toLowerCase() === decoded.toLowerCase()
    );
    if (canonical) return canonical;
    if (decoded.length > 0 && decoded.length <= 48) {
      return decoded;
    }
  }

  // 2. Match mot kundetags
  if (tags.length > 0 && safeCategories.length > 0) {
    const normalizedTags = tags.map((t) => t.toLowerCase().trim());
    for (const cat of safeCategories) {
      const catLower = cat.toLowerCase();
      if (normalizedTags.some((tag) => tag === catLower || tag.includes(catLower))) {
        return cat;
      }
    }
  }

  // 3. Match mot tittel
  const lowerTitle = title.toLowerCase();
  for (const cat of safeCategories) {
    if (lowerTitle.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  // 4. Match mot renset artikkeltekst
  const lowerBody = stripHtmlToPlainText(content).toLowerCase();
  for (const cat of safeCategories) {
    if (lowerBody.includes(cat.toLowerCase())) {
      return cat;
    }
  }

  return fallback;
}

/**
 * Estimerer lesetid i minutter basert på 210 ord/min, avgrenset mellom 3 og 12 minutter.
 */
export function estimateReadMinutes(html: string): number {
  const plain = stripHtmlToPlainText(html);
  if (!plain) return 3;
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.round(words / 210);
  return Math.max(3, Math.min(12, minutes));
}

/**
 * Henter et rent tekstutdrag uten HTML-tagger og skjulte data-category-markører.
 */
export function extractExcerpt(html: string, maxLength: number = 180): string {
  const clean = stripHtmlToPlainText(html);
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;

  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  const trimmed = lastSpace > maxLength * 0.65 ? sliced.slice(0, lastSpace) : sliced;
  return `${trimmed.trim().replace(/[.,;:!?-]+$/, '')}…`;
}

/**
 * Finner første bilde-URL i artikkelens HTML-innhold.
 */
export function extractFirstImage(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Formaterer dato på norsk bokmål (kort eller lang stil).
 */
export function formatNorwegianDate(
  date: Date | string | null | undefined,
  style: 'short' | 'long' = 'short'
): string {
  if (!date) return '';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}

function parseHexColor(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (/^[0-9a-f]{6}$/i.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function getRelativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 0.15;
  const [r, g, b] = rgb.map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returnerer true dersom en hex-farge er mørk (luminans < 0.35).
 */
export function isDarkHex(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.35;
}

/**
 * Velger hvit eller nesten-svart tekstfarge med høyest WCAG AA-kontrast mot en bakgrunnsfarge.
 */
export function getContrastInk(hex: string): '#ffffff' | '#111111' {
  const lum = getRelativeLuminance(hex);
  const contrastWhite = (1.0 + 0.05) / (lum + 0.05);
  const contrastDark = (lum + 0.05) / (0.0056 + 0.05);
  return contrastWhite >= contrastDark ? '#ffffff' : '#111111';
}

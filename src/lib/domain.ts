import 'server-only';
import { domainToASCII, domainToUnicode } from 'node:url';
import { SITE_CONFIG } from '@/config/site';

/**
 * Returnerer både ASCII/punycode- og Unicode-varianten av domenet slik at
 * oppslag mot Publisher-tabellen alltid treffer uansett lagringsformat.
 */
export function getDomainCandidates(domain: string = SITE_CONFIG.domain): string[] {
  const normalized = domain.trim().toLowerCase().replace(/^www\./, '');
  const candidates = new Set<string>();

  if (normalized) {
    candidates.add(normalized);
    const ascii = domainToASCII(normalized);
    const unicode = domainToUnicode(normalized);
    if (ascii) candidates.add(ascii.toLowerCase());
    if (unicode) candidates.add(unicode.toLowerCase());
  }

  const displayNormalized = SITE_CONFIG.displayDomain.trim().toLowerCase();
  if (displayNormalized) {
    candidates.add(displayNormalized);
    const ascii = domainToASCII(displayNormalized);
    const unicode = domainToUnicode(displayNormalized);
    if (ascii) candidates.add(ascii.toLowerCase());
    if (unicode) candidates.add(unicode.toLowerCase());
  }

  return Array.from(candidates);
}

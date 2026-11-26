'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/config/site';
import { getDomainCandidates } from '@/lib/domain';

export interface LeadActionResult {
  success?: boolean;
  error?: string;
}

const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutter
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter(
    (ts) => now - ts < RATE_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitStore.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitStore.set(key, timestamps);

  // Enkel opprydding så minnet ikke vokser ved lang kjøretid
  if (rateLimitStore.size > 1000) {
    for (const [k, list] of rateLimitStore.entries()) {
      const valid = list.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (valid.length === 0) {
        rateLimitStore.delete(k);
      } else {
        rateLimitStore.set(k, valid);
      }
    }
  }

  return false;
}

async function getClientIp(): Promise<string> {
  // Next 15/16: headers() er asynkron.
  const hdrs = await headers();
  const forwarded = hdrs.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return hdrs.get('x-real-ip')?.trim() || 'unknown';
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitLeadAction(
  prevState: LeadActionResult | null,
  formData: FormData
): Promise<LeadActionResult> {
  // 1. Honeypot-beskyttelse mot automatiske bots
  const websiteHp = (formData.get('website_hp') as string) || '';
  if (websiteHp.trim().length > 0) {
    return { success: true };
  }

  const rawName = (formData.get('name') as string) || '';
  const rawEmail = (formData.get('email') as string) || '';
  const rawPhone = (formData.get('phone') as string) || '';
  const rawMessage = (formData.get('message') as string) || '';
  const rawCustomerId = (formData.get('customerId') as string) || '';
  const rawSourceUrl = (formData.get('sourceUrl') as string) || '';

  const name = rawName.trim();
  const email = rawEmail.trim().toLowerCase();
  const phone = rawPhone.trim();
  const message = rawMessage.trim();
  const customerId = rawCustomerId.trim();

  // 2. Streng input-validering
  if (name.length < 2 || name.length > 120) {
    return { error: 'Vennligst oppgi fullt navn (minimum 2 tegn).' };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 180) {
    return { error: 'Vennligst oppgi en gyldig e-postadresse.' };
  }

  if (phone.length > 40) {
    return { error: 'Telefonnummeret er for langt.' };
  }

  if (message.length > 2000) {
    return { error: 'Meldingen kan maks være 2000 tegn.' };
  }

  if (!customerId || customerId.length > 100) {
    return { error: 'Ugyldig mottaker for henvendelsen.' };
  }

  // 3. Rate limiting pr IP og e-post
  const clientIp = await getClientIp();
  if (isRateLimited(`ip:${clientIp}`) || isRateLimited(`email:${email}`)) {
    return {
      error: 'For mange henvendelser på kort tid. Vennligst vent noen minutter før du prøver igjen.',
    };
  }

  const safeSourceUrl =
    rawSourceUrl.startsWith('https://') ||
    rawSourceUrl.startsWith('http://') ||
    rawSourceUrl.startsWith('/')
      ? rawSourceUrl.slice(0, 500)
      : `https://${SITE_CONFIG.displayDomain}`;

  try {
    // 4. Verifiser at publisisten har aktivert leads og at kunden eksisterer
    const domainCandidates = getDomainCandidates(SITE_CONFIG.domain);
    const [publisher, customer] = await Promise.all([
      prisma.publisher.findFirst({
        where: { domain: { in: domainCandidates } },
        select: { id: true, leadsEnabled: true },
      }),
      prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      }),
    ]);

    if (!publisher || !publisher.leadsEnabled) {
      return { error: 'Kontaktskjemaet er ikke tilgjengelig akkurat nå.' };
    }

    if (!customer) {
      return { error: 'Fant ikke mottaker for henvendelsen.' };
    }

    await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        customerId: customer.id,
        sourceUrl: safeSourceUrl,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Feil ved lagring av henvendelse:', err);
    return { error: 'Kunne ikke lagre henvendelsen. Vennligst prøv igjen senere.' };
  }
}

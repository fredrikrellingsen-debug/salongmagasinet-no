'use client';

import React, { useState, useTransition } from 'react';
import { submitLeadAction, LeadActionResult } from '@/actions/lead';
import { CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';

interface LeadFormProps {
  customerId: string;
  companyName?: string;
  sourceUrl?: string;
}

export default function LeadForm({ customerId, companyName, sourceUrl }: LeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<LeadActionResult | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('customerId', customerId);
    if (sourceUrl) {
      formData.set('sourceUrl', sourceUrl);
    } else if (typeof window !== 'undefined') {
      formData.set('sourceUrl', window.location.href);
    }

    startTransition(async () => {
      const res = await submitLeadAction(null, formData);
      setResult(res);
      if (res.success) {
        form.reset();
      }
    });
  };

  return (
    <section
      className="mt-12 p-6 sm:p-8 rounded-md border-t-2 border"
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        borderTopColor: 'var(--accent)',
        color: 'var(--ink)',
      }}
    >
      <div className="max-w-2xl">
        <span
          className="text-xs font-mono uppercase tracking-widest font-bold block mb-1"
          style={{ color: 'var(--accent)' }}
        >
          Direkte kontakt
        </span>
        <h3
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
        >
          Interessert? Ta kontakt med {companyName || 'bedriften'}
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Fyll ut skjemaet under, så tar {companyName || 'bedriften'} kontakt med deg for en uforpliktende prat.
        </p>

        {result?.success ? (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-md flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Takk for din henvendelse!</h4>
              <p className="text-sm mt-1 text-emerald-800">
                Vi har mottatt meldingen din og videreformidlet den direkte til {companyName || 'aktøren'}.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Skjult honeypot-felt mot automatisert spam */}
            <input
              type="text"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            {result?.error && (
              <div
                role="alert"
                className="p-3 rounded-md flex items-center gap-2 text-sm border"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--accent)',
                  color: 'var(--ink)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <span>{result.error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="lead-name"
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--ink)' }}
                >
                  Fullt navn <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  id="lead-name"
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Ola Nordmann"
                  className="w-full min-h-[44px] rounded-md px-3.5 py-2.5 text-sm border outline-none transition-colors focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="lead-phone"
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: 'var(--ink)' }}
                >
                  Telefonnummer
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  name="phone"
                  maxLength={40}
                  placeholder="+47 900 00 000"
                  className="w-full min-h-[44px] rounded-md px-3.5 py-2.5 text-sm border outline-none transition-colors focus:ring-2"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="lead-email"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--ink)' }}
              >
                E-postadresse <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                id="lead-email"
                type="email"
                name="email"
                required
                maxLength={180}
                placeholder="ola@bedrift.no"
                className="w-full min-h-[44px] rounded-md px-3.5 py-2.5 text-sm border outline-none transition-colors focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="lead-message"
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--ink)' }}
              >
                Melding eller spørsmål (valgfritt)
              </label>
              <textarea
                id="lead-message"
                name="message"
                rows={3}
                maxLength={2000}
                placeholder="Hva ønsker du mer informasjon om?"
                className="w-full min-h-[96px] rounded-md px-3.5 py-2.5 text-sm border outline-none transition-colors focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-md font-bold uppercase tracking-wider text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sender...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send henvendelse
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

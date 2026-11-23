import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 text-center max-w-lg mx-auto space-y-4">
      <Compass className="w-14 h-14 mx-auto opacity-60" style={{ color: 'var(--accent)' }} />
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
      >
        Siden ble ikke funnet
      </h1>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
        Artikkelen eller siden du forsøkte å åpne eksisterer ikke, eller har blitt flyttet.
      </p>
      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-white font-bold uppercase tracking-wider text-xs rounded-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Tilbake til forsiden
        </Link>
      </div>
    </div>
  );
}

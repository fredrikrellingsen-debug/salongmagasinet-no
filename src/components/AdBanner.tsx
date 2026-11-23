import React from 'react';

export interface AdItem {
  id: string;
  imageUrl: string;
  targetUrl: string;
  slotId: string;
}

interface AdBannerProps {
  ads: AdItem[];
  slotId: string;
  adsEnabled: boolean;
  className?: string;
}

function isSafeImageUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/images/')) return true;
  if (trimmed.startsWith('https://')) {
    return !/unsplash\.com|pexels\.com/i.test(trimmed);
  }
  return false;
}

function isSafeTargetUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export default function AdBanner({ ads, slotId, adsEnabled, className = '' }: AdBannerProps) {
  if (!adsEnabled || !ads || ads.length === 0) {
    return null;
  }

  const ad = ads.find((a) => a.slotId === slotId);
  if (!ad || !isSafeImageUrl(ad.imageUrl) || !isSafeTargetUrl(ad.targetUrl)) {
    return null;
  }

  return (
    <aside
      aria-label="Annonse"
      className={`w-full relative overflow-hidden flex items-center justify-center p-1.5 rounded-sm border ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <span
        className="absolute top-2 left-2.5 text-[10px] font-mono tracking-widest uppercase font-bold z-10 px-1.5 py-0.5 rounded-sm select-none"
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--muted)',
          border: '1px solid var(--border)',
        }}
      >
        Annonse
      </span>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="w-full block hover:opacity-95 transition-opacity"
      >
        <img
          src={ad.imageUrl}
          alt="Annonse"
          width={1200}
          height={240}
          className="w-full h-36 sm:h-48 object-cover mx-auto rounded-sm"
          loading="lazy"
          decoding="async"
        />
      </a>
    </aside>
  );
}

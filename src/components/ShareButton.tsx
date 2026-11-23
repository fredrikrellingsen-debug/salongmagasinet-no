'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
}

export default function ShareButton({
  title,
  url,
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showCopiedToast = () => {
    setCopied(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2600);
  };

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined' && window.location?.href
        ? window.location.href
        : url;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showCopiedToast();
        return;
      }
    } catch {
      // Fallback nedenfor
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopiedToast();
    } catch {
      // Ignorerer kopieringsfeil
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? 'Lenke kopiert' : 'Del artikkel'}
        className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full border text-xs font-semibold transition-colors ${className}`}
        style={{
          backgroundColor: copied ? 'var(--accent-soft)' : 'var(--surface)',
          borderColor: copied ? 'var(--accent)' : 'var(--border)',
          color: copied ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Lenke kopiert!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Del</span>
          </>
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Lenke kopiert til utklippstavlen.' : ''}
      </span>
    </div>
  );
}

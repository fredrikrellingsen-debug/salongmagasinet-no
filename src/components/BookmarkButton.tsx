'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';

export const BOOKMARKS_EVENT = 'mag-bookmarks-changed';

export interface SavedArticleItem {
  id: string;
  title: string;
  category: string;
  image: string;
  savedAt: string;
}

export function getBookmarkStorageKey(domain: string): string {
  const cleanDomain = (domain || 'magasin').trim().toLowerCase();
  return `mag_bookmarks_${cleanDomain}`;
}

export function readBookmarks(domain: string): SavedArticleItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getBookmarkStorageKey(domain));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedArticleItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string'
    );
  } catch {
    return [];
  }
}

export function writeBookmarks(domain: string, items: SavedArticleItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getBookmarkStorageKey(domain),
      JSON.stringify(items.slice(0, 50))
    );
    window.dispatchEvent(
      new CustomEvent(BOOKMARKS_EVENT, {
        detail: { domain, count: items.length },
      })
    );
  } catch {
    // Ignorerer lagringsfeil i privat modus
  }
}

interface BookmarkButtonProps {
  domain: string;
  article: {
    id: string;
    title: string;
    category: string;
    image: string;
  };
  variant?: 'icon' | 'pill' | 'overlay';
  className?: string;
}

export default function BookmarkButton({
  domain,
  article,
  variant = 'icon',
  className = '',
}: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const current = readBookmarks(domain);
      setSaved(current.some((item) => item.id === article.id));
    };

    syncState();

    const handleCustom = () => syncState();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getBookmarkStorageKey(domain)) {
        syncState();
      }
    };

    window.addEventListener(BOOKMARKS_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, [domain, article.id]);

  const toggleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const current = readBookmarks(domain);
    const exists = current.some((item) => item.id === article.id);

    if (exists) {
      const updated = current.filter((item) => item.id !== article.id);
      writeBookmarks(domain, updated);
      setSaved(false);
    } else {
      const nextItem: SavedArticleItem = {
        id: article.id,
        title: article.title,
        category: article.category,
        image: article.image,
        savedAt: new Date().toISOString(),
      };
      const updated = [nextItem, ...current.filter((item) => item.id !== article.id)];
      writeBookmarks(domain, updated);
      setSaved(true);
    }
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleBookmark}
        aria-label={saved ? 'Fjern lagret artikkel' : 'Lagre artikkel'}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full border text-xs font-semibold transition-colors ${className}`}
        style={{
          backgroundColor: saved ? 'var(--accent-soft)' : 'var(--surface)',
          borderColor: saved ? 'var(--accent)' : 'var(--border)',
          color: saved ? 'var(--accent)' : 'var(--ink)',
        }}
      >
        <Bookmark
          className="w-4 h-4 shrink-0"
          fill={saved ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        <span>{saved ? 'Lagret' : 'Lagre'}</span>
      </button>
    );
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={toggleBookmark}
        aria-label={saved ? 'Fjern lagret artikkel' : 'Lagre artikkel'}
        aria-pressed={saved}
        title={saved ? 'Fjern fra lagrede saker' : 'Lagre artikkel'}
        className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border shadow-sm backdrop-blur-md transition-transform active:scale-95 ${className}`}
        style={{
          backgroundColor: saved ? 'var(--accent)' : 'rgba(17, 17, 17, 0.72)',
          borderColor: saved ? 'var(--accent)' : 'rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
        }}
      >
        <Bookmark
          className="w-4 h-4"
          fill={saved ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      aria-label={saved ? 'Fjern lagret artikkel' : 'Lagre artikkel'}
      aria-pressed={saved}
      title={saved ? 'Fjern fra lagrede saker' : 'Lagre artikkel'}
      className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border transition-colors hover:opacity-90 active:scale-95 ${className}`}
      style={{
        backgroundColor: saved ? 'var(--accent-soft)' : 'var(--bg)',
        borderColor: saved ? 'var(--accent)' : 'var(--border)',
        color: saved ? 'var(--accent)' : 'var(--muted)',
      }}
    >
      <Bookmark
        className="w-4 h-4"
        fill={saved ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bookmark,
  ChevronRight,
  Home,
  LayoutGrid,
  Mail,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  BOOKMARKS_EVENT,
  getBookmarkStorageKey,
  readBookmarks,
  writeBookmarks,
  type SavedArticleItem,
} from '@/components/BookmarkButton';

export const OPEN_SEARCH_EVENT = 'mag-open-search';

interface MobileAppShellProps {
  siteName: string;
  shortMark: string;
  displayDomain: string;
  categories: string[];
  tipsEmail: string;
  accentInk?: string;
}

type ActivePanel = 'none' | 'categories' | 'search' | 'saved';

export default function MobileAppShell({
  siteName,
  shortMark,
  displayDomain,
  categories,
  tipsEmail,
  accentInk = '#ffffff',
}: MobileAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get('kategori') || '';
  const activeSearch = searchParams?.get('sok') || '';

  const [panel, setPanel] = useState<ActivePanel>('none');
  const [query, setQuery] = useState(activeSearch);
  const [bookmarks, setBookmarks] = useState<SavedArticleItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuery(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    const syncBookmarks = () => {
      setBookmarks(readBookmarks(displayDomain));
    };

    syncBookmarks();

    const handleCustom = () => syncBookmarks();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === getBookmarkStorageKey(displayDomain)) {
        syncBookmarks();
      }
    };
    const handleOpenSearch = () => {
      setPanel('search');
    };

    window.addEventListener(BOOKMARKS_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);

    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(OPEN_SEARCH_EVENT, handleOpenSearch);
    };
  }, [displayDomain]);

  useEffect(() => {
    if (panel === 'none') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanel('none');
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    if (panel === 'search') {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [panel]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    setPanel('none');
    if (!trimmed) {
      router.push('/');
      return;
    }
    router.push(`/?sok=${encodeURIComponent(trimmed)}`);
  };

  const handleRemoveBookmark = (id: string) => {
    const updated = bookmarks.filter((item) => item.id !== id);
    writeBookmarks(displayDomain, updated);
    setBookmarks(updated);
  };

  const handleClearBookmarks = () => {
    writeBookmarks(displayDomain, []);
    setBookmarks([]);
  };

  const isHomeActive = pathname === '/' && !activeCategory && !activeSearch && panel === 'none';
  const isCategoriesActive = panel === 'categories' || (pathname === '/' && Boolean(activeCategory));
  const isSearchActive = panel === 'search' || (pathname === '/' && Boolean(activeSearch));
  const isSavedActive = panel === 'saved';

  const safeImageSrc = (src: string) =>
    src && src.startsWith('/images/') ? src : '/images/hero.webp';

  return (
    <>
      {/* Backdrop for Drawers & Search Modal */}
      {panel !== 'none' && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setPanel('none')}
          aria-hidden="true"
        />
      )}

      {/* Categories Bottom Sheet Drawer */}
      {panel === 'categories' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Seksjoner i ${siteName}`}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl animate-sheet-up lg:hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--ink)',
            paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <span
              className="w-10 h-1 rounded-full opacity-35"
              style={{ backgroundColor: 'var(--muted)' }}
              aria-hidden="true"
            />
          </div>

          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                {shortMark}
              </span>
              <div>
                <h2
                  className="text-base font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  Kategorier
                </h2>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {siteName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanel('none')}
              aria-label="Lukk kategorimeny"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--ink)',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav aria-label="Alle kategorier" className="p-4 space-y-1.5">
            <Link
              href="/"
              onClick={() => setPanel('none')}
              className="flex items-center justify-between px-4 min-h-[50px] rounded-xl text-sm font-semibold transition-colors"
              style={{
                backgroundColor: !activeCategory ? 'var(--accent-soft)' : 'var(--bg)',
                color: !activeCategory ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              <span>Alle saker</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </Link>

            {categories.map((category) => {
              const isSelected = activeCategory.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?kategori=${encodeURIComponent(category)}`}
                  onClick={() => setPanel('none')}
                  className="flex items-center justify-between px-4 min-h-[50px] rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg)',
                    color: isSelected ? 'var(--accent)' : 'var(--ink)',
                  }}
                >
                  <span>{category}</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </Link>
              );
            })}
          </nav>

          <div
            className="mx-4 mt-2 pt-3 border-t flex items-center justify-between text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <a
              href={`mailto:${tipsEmail}`}
              className="inline-flex items-center gap-2 min-h-[44px] font-medium hover:underline"
              style={{ color: 'var(--ink)' }}
            >
              <Mail className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Tips redaksjonen
            </a>
            <span>{displayDomain}</span>
          </div>
        </div>
      )}

      {/* App Search Modal (works on mobile, tablet & triggered from header search) */}
      {panel === 'search' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Søk i ${siteName}`}
          className="fixed inset-x-3 top-14 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl border shadow-2xl overflow-hidden animate-fade-in"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--ink)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            >
              Søk i {siteName}
            </h2>
            <button
              type="button"
              onClick={() => setPanel('none')}
              aria-label="Lukk søk"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--ink)',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--muted)' }}
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søk etter tema, saker eller nøkkelord…"
                  aria-label="Søkeord"
                  className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border text-sm"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="min-h-[46px] px-5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0"
                style={{ backgroundColor: 'var(--accent)', color: accentInk }}
              >
                Søk
              </button>
            </form>

            <div className="space-y-2.5">
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--muted)' }}
              >
                Hurtigvalg etter kategori
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?kategori=${encodeURIComponent(cat)}`}
                    onClick={() => setPanel('none')}
                    className="inline-flex items-center min-h-[40px] px-3.5 rounded-full border text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--ink)',
                    }}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Articles Drawer */}
      {panel === 'saved' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lagrede artikler"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[84vh] flex flex-col rounded-t-2xl border-t shadow-2xl animate-sheet-up lg:hidden"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--ink)',
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <span
              className="w-10 h-1 rounded-full opacity-35"
              style={{ backgroundColor: 'var(--muted)' }}
              aria-hidden="true"
            />
          </div>

          <div
            className="flex items-center justify-between px-5 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <h2
                className="text-base font-bold leading-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
              >
                Lagrede saker ({bookmarks.length})
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                Lagres lokalt i nettleseren din
              </p>
            </div>
            <div className="flex items-center gap-2">
              {bookmarks.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBookmarks}
                  className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg text-xs font-semibold hover:underline"
                  style={{ color: 'var(--muted)' }}
                >
                  Tøm alle
                </button>
              )}
              <button
                type="button"
                onClick={() => setPanel('none')}
                aria-label="Lukk lagrede saker"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--ink)',
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <Bookmark className="w-5 h-5" />
                </div>
                <p
                  className="text-sm font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                >
                  Ingen lagrede artikler ennå
                </p>
                <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--muted)' }}>
                  Trykk på bokmerke-ikonet på en artikkel for å lagre den til senere lesing.
                </p>
              </div>
            ) : (
              bookmarks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <Link
                    href={`/artikkel/${item.id}`}
                    onClick={() => setPanel('none')}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <img
                      src={safeImageSrc(item.image)}
                      alt={item.title}
                      width={128}
                      height={72}
                      loading="lazy"
                      decoding="async"
                      className="w-20 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--accent)' }}
                      >
                        {item.category}
                      </span>
                      <p
                        className="text-xs font-bold leading-snug line-clamp-2"
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
                      >
                        {item.title}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveBookmark(item.id)}
                    aria-label={`Fjern ${item.title} fra lagrede`}
                    className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shrink-0"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Native Mobile & Pad Bottom Tab Bar */}
      <nav
        aria-label="Hovednavigasjon for mobil"
        className="fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl lg:hidden"
        style={{
          borderColor: 'var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="absolute inset-0 -z-10 opacity-[0.92]"
          style={{ backgroundColor: 'var(--surface)' }}
          aria-hidden="true"
        />

        <div className="grid grid-cols-4 max-w-xl mx-auto">
          <Link
            href="/"
            onClick={() => setPanel('none')}
            aria-current={isHomeActive ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-1 min-h-[56px] py-1.5 transition-colors"
            style={{ color: isHomeActive ? 'var(--accent)' : 'var(--muted)' }}
          >
            <Home className="w-5 h-5" strokeWidth={isHomeActive ? 2.4 : 1.9} aria-hidden="true" />
            <span className="text-[11px] font-semibold leading-none">Forside</span>
          </Link>

          <button
            type="button"
            onClick={() => setPanel(panel === 'categories' ? 'none' : 'categories')}
            aria-expanded={panel === 'categories'}
            className="flex flex-col items-center justify-center gap-1 min-h-[56px] py-1.5 transition-colors"
            style={{ color: isCategoriesActive ? 'var(--accent)' : 'var(--muted)' }}
          >
            <LayoutGrid
              className="w-5 h-5"
              strokeWidth={isCategoriesActive ? 2.4 : 1.9}
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold leading-none">Kategorier</span>
          </button>

          <button
            type="button"
            onClick={() => setPanel(panel === 'search' ? 'none' : 'search')}
            aria-expanded={panel === 'search'}
            className="flex flex-col items-center justify-center gap-1 min-h-[56px] py-1.5 transition-colors"
            style={{ color: isSearchActive ? 'var(--accent)' : 'var(--muted)' }}
          >
            <Search
              className="w-5 h-5"
              strokeWidth={isSearchActive ? 2.4 : 1.9}
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold leading-none">Søk</span>
          </button>

          <button
            type="button"
            onClick={() => setPanel(panel === 'saved' ? 'none' : 'saved')}
            aria-expanded={panel === 'saved'}
            className="relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-1.5 transition-colors"
            style={{ color: isSavedActive ? 'var(--accent)' : 'var(--muted)' }}
          >
            <span className="relative inline-flex">
              <Bookmark
                className="w-5 h-5"
                strokeWidth={isSavedActive ? 2.4 : 1.9}
                fill={bookmarks.length > 0 && isSavedActive ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              {bookmarks.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none"
                  style={{ backgroundColor: 'var(--accent)', color: accentInk }}
                >
                  {bookmarks.length > 99 ? '99+' : bookmarks.length}
                </span>
              )}
            </span>
            <span className="text-[11px] font-semibold leading-none">Lagret</span>
          </button>
        </div>
      </nav>
    </>
  );
}

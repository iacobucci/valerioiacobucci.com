'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { ContentMetadata } from '@/lib/content';
import { MdCalendarToday, MdTag, MdStar, MdEditCalendar, MdLanguage } from 'react-icons/md';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';
import { useTranslations } from 'next-intl';

interface ContentListProps {
  items: ContentMetadata[];
  type: string;
  locale: string;
}

export default function ContentList({ items, type, locale }: ContentListProps) {
  const router = useRouter();
  const t = useTranslations('blog');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [visibleCount, setVisibleCount] = useState(6);
  const listRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => {
        if (tag !== 'favorites') tags.add(tag);
      });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags?.includes(selectedTag));
    }

    // Always sort by ORIGINAL publication date newest first
    return filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [items, selectedTag]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMore = visibleCount < filteredItems.length;

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 6);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < visibleItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const item = visibleItems[focusedIndex];
        if (item) {
          router.push(`/${type}/${item.slug}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleItems, focusedIndex, router, type]);

  // Reset focus and count when filters change
  useEffect(() => {
    setFocusedIndex(-1);
    setVisibleCount(6);
  }, [selectedTag]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.children;
      const focusedElement = children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="space-y-4">
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-2">
              <MdTag className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTag === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {allTags.map(tag => {
              const active = selectedTag === tag;
              
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(active ? null : tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-6" ref={listRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleItems.map((item, index) => {
            // Handle relative cover image
            let finalCover = item.cover;
            if (typeof finalCover === 'string' && !finalCover.startsWith('http') && !finalCover.startsWith('/')) {
              const date = item.updated || item.date;
              const version = date ? new Date(date).getTime() : '';
              const normalized = finalCover.startsWith('./') ? finalCover.slice(2) : finalCover;
              finalCover = `/assets/${type}/${item.slug}/${normalized}`;
              if (version) {
                finalCover += `?v=${version}`;
              }
            }
            
            const coverSrc = typeof finalCover === 'string' ? finalCover : undefined;
            const isFocused = index === focusedIndex;
            const hasSelected = item.selected;

            return (
              <motion.div
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.slug}
                onMouseEnter={() => setFocusedIndex(index)}
                style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                className={`card-enter transition-all duration-200 rounded-2xl ${
                  isFocused 
                    ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-bg-dark shadow-lg scale-[1.01]' 
                    : ''
                }`}
              >
                <Link
                  href={`/${type}/${item.slug}`}
                  onMouseEnter={() => router.prefetch(`/${type}/${item.slug}`)}
                  className="group flex flex-col sm:flex-row gap-6 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800/50 transition-all duration-300 overflow-hidden hover:shadow-xl"
                >
                  {coverSrc && (
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={coverSrc}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col flex-1 justify-center py-2">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {hasSelected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-black uppercase tracking-widest ring-1 ring-yellow-200 dark:ring-yellow-800">
                          <MdStar className="text-yellow-500" />
                          {t('favorites_title')}
                        </span>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {item.tags?.map(tag => (
                          <span 
                            key={tag}
                            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {item.isFallback && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-widest">
                          <MdLanguage className="w-3 h-3" />
                          {item.language.toUpperCase()} ONLY
                        </span>
                      )}

                      {item.draft && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest">
                          {t('draft_badge')}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-auto">
                      {item.date && (
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5" title="Published date">
                          <MdCalendarToday className="w-3.5 h-3.5" />
                          <FormattedDate date={item.date} locale={locale} />
                        </div>
                      )}
                      {item.updated && (
                        <div className="text-xs font-medium text-blue-500/80 dark:text-blue-400/80 flex items-center gap-1.5" title="Last updated">
                          <MdEditCalendar className="w-3.5 h-3.5" />
                          <FormattedDate date={item.updated} locale={locale} />
                        </div>
                      )}
                      {item.readingTime && (
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                          {item.readingTime} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Loader for infinite scroll */}
      {hasMore && (
        <div ref={loaderRef} className="py-12 flex justify-center">
          <div className="flex items-center gap-3 text-gray-400 font-medium animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more posts...</span>
          </div>
        </div>
      )}
      
      {filteredItems.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No results found for your filter.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { ContentMetadata } from '@/lib/content';
import { MdCalendarToday, MdSortByAlpha, MdFormatListNumbered, MdTag } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';

interface ContentListProps {
  items: ContentMetadata[];
  type: string;
  locale: string;
}

type SortBy = 'date' | 'alphabetical' | 'predefined';

export default function ContentList({ items, type, locale }: ContentListProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags?.includes(selectedTag));
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA; // Newest first
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'predefined') {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;
        return orderA - orderB;
      }
      return 0;
    });
  }, [items, sortBy, selectedTag]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const item = filteredItems[focusedIndex];
        if (item) {
          router.push(`/${type}/${item.slug}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, focusedIndex, router, type]);

  // Reset focus when filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [selectedTag, sortBy]);

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

  const sortOptions = [
    { id: 'date', label: 'By Date', icon: MdCalendarToday },
    { id: 'alphabetical', label: 'A-Z', icon: MdSortByAlpha },
    { id: 'predefined', label: 'Order', icon: MdFormatListNumbered },
  ];

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 overflow-x-auto">
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id as SortBy)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-2">
              <MdTag className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedTag === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-6" ref={listRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredItems.map((item, index) => {
            // Handle relative cover image
            let finalCover = item.coverImage;
            if (typeof finalCover === 'string' && !finalCover.startsWith('http') && !finalCover.startsWith('/')) {
              const normalized = finalCover.startsWith('./') ? finalCover.slice(2) : finalCover;
              finalCover = `/assets/${type}/${item.slug}/${normalized}`;
            }
            
            const coverSrc = typeof finalCover === 'string' ? finalCover : undefined;
            const isFocused = index === focusedIndex;

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
                  className="group flex flex-col sm:flex-row gap-6 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {coverSrc && (
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={coverSrc}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col flex-1 justify-center py-2">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags?.map(tag => (
                        <span 
                          key={tag}
                          className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {item.title}
                    </h3>
                    
                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-auto">
                      {item.date && (
                        <div className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                          <MdCalendarToday className="w-3.5 h-3.5" />
                          <FormattedDate date={item.date} locale={locale} />
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
      
      {filteredItems.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No results found for your filter.</p>
        </div>
      )}
    </div>
  );
}

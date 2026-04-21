'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { ContentMetadata } from '@/lib/content';
import { MdCalendarToday, MdSortByAlpha, MdFormatListNumbered } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentListProps {
  items: ContentMetadata[];
  type: string;
}

type SortBy = 'date' | 'alphabetical' | 'predefined';

export default function ContentList({ items, type }: ContentListProps) {
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const sortedItems = [...items].sort((a, b) => {
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

  const sortOptions = [
    { id: 'date', label: 'By Date', icon: MdCalendarToday },
    { id: 'alphabetical', label: 'A-Z', icon: MdSortByAlpha },
    { id: 'predefined', label: 'Order', icon: MdFormatListNumbered },
  ];

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 overflow-x-auto">
        {sortOptions.map((opt) => {
          const Icon = opt.icon;
          const active = sortBy === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSortBy(opt.id as SortBy)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <ul className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item) => (
            <motion.li
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={item.slug}
            >
              <Link
                href={`/${type}/${item.slug}`}
                className="group block p-4 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-fg-light dark:text-fg-dark group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  {item.date && (
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

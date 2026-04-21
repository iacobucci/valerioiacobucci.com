'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { ContentMetadata } from '@/lib/mdx';
import { Calendar, SortAsc, Hash } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setSortBy('date')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            sortBy === 'date'
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          By Date
        </button>
        <button
          onClick={() => setSortBy('alphabetical')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            sortBy === 'alphabetical'
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <SortAsc className="w-3.5 h-3.5" />
          A-Z
        </button>
        <button
          onClick={() => setSortBy('predefined')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            sortBy === 'predefined'
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Order
        </button>
      </div>

      <ul className="space-y-4">
        {sortedItems.map((item) => (
          <li key={item.slug} className="group">
            <Link
              href={`/${type}/${item.slug}`}
              className="block p-4 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all"
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
          </li>
        ))}
      </ul>
    </div>
  );
}

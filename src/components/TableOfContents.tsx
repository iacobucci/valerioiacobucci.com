'use client';

import React, { useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { TocItem } from '@/lib/toc';

export type { TocItem };

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!items || items.length < 2) return null;

  return (
    <nav 
      aria-label="Table of contents" 
      className="my-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30 overflow-hidden transition-all"
    >
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 px-6 text-left hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5 font-bold text-xs tracking-wider text-gray-800 dark:text-gray-200 uppercase">
          <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Table of Contents</span>
          <span className="text-[10px] font-mono text-gray-400">({items.length})</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>

      {!collapsed && (
        <div className="px-6 pb-6 pt-1">
          <ul className="space-y-2 border-l border-gray-200 dark:border-gray-800 pl-4">
            {items.map((item, idx) => {
              const indent = Math.max(0, item.level - 2) * 14;
              return (
                <li 
                  key={`${item.id}-${idx}`} 
                  style={{ marginLeft: `${indent}px` }}
                  className="list-none"
                >
                  <a 
                    href={`#${item.id}`} 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5"
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { MicroblogPostSerializable } from '@/lib/db';
import MicroblogPostCard from './MicroblogPostCard';

interface MicroblogListProps {
  posts: MicroblogPostSerializable[];
  locale: string;
  noPostsMessage: string;
}

export default function MicroblogList({ posts, locale, noPostsMessage }: MicroblogListProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

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
        setFocusedIndex(prev => (prev < posts.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts.length]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.children;
      const focusedElement = children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {noPostsMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={listRef}>
      {posts.map((post, index) => (
        <div 
          key={post.id} 
          onMouseEnter={() => setFocusedIndex(index)}
          className={`transition-all duration-200 rounded-2xl ${
            index === focusedIndex 
              ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-bg-dark shadow-lg scale-[1.02]' 
              : ''
          }`}
        >
          <MicroblogPostCard post={post} locale={locale} />
        </div>
      ))}
    </div>
  );
}

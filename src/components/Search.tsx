'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';
import { Search as SearchIcon, FileText, Star, Layout, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';

interface SearchResult {
  title: string;
  type: 'blog' | 'favorites' | 'page';
  href: string;
  description?: string;
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data for searching
  useEffect(() => {
    if (isOpen && allData.length === 0) {
      fetch(`/api/search?locale=${locale}`)
        .then(res => res.json())
        .then(data => setAllData(data))
        .catch(err => console.error('Search fetch error:', err));
    }
  }, [isOpen, locale, allData.length]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter results
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const filtered = allData.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, allData]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    router.push(result.href);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'favorites': return <Star className="w-4 h-4" />;
      default: return <Layout className="w-4 h-4" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group"
        aria-label="Search"
      >
        <MdSearch className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="hidden lg:inline text-xs font-medium opacity-60">Search...</span>
        <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] font-bold opacity-60">
          <Command size={10} /> K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
                <SearchIcon className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What are you looking for?"
                  className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <MdClose className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <button
                        key={result.href}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all ${
                          index === selectedIndex 
                            ? 'bg-gray-100 dark:bg-gray-800' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          result.type === 'blog' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          result.type === 'favorites' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">
                            {result.title}
                          </h4>
                          {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {result.type}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : query ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 space-y-2">
                    <p className="text-sm font-medium">Type to search blog posts, favorites, and pages.</p>
                    <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-tighter">
                      <span className="flex items-center gap-1"><Command size={10} /> K to search</span>
                      <span className="flex items-center gap-1">↑↓ to navigate</span>
                      <span className="flex items-center gap-1">Enter to select</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

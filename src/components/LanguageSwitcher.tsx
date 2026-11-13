'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { routing, usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function FlagUK({ className = "w-[26px] h-[17.5px] rounded-xs shrink-0" }: { className?: string }) {
  return (
    <svg className={`overflow-hidden ${className}`} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0l60 40m0-40L0 40" stroke="#fff" strokeWidth="7" />
      <path d="M0 0l60 40m0-40L0 40" stroke="#C8102E" strokeWidth="2.5" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="11" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function FlagNL({ className = "w-[26px] h-[17.5px] rounded-xs shrink-0" }: { className?: string }) {
  return (
    <svg className={`overflow-hidden ${className}`} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="13.33" fill="#AE1C28" />
      <rect y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#21468B" />
    </svg>
  );
}

export function FlagIT({ className = "w-[26px] h-[17.5px] rounded-xs shrink-0" }: { className?: string }) {
  return (
    <svg className={`overflow-hidden ${className}`} viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="40" fill="#009246" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#CE2B37" />
    </svg>
  );
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  Flag: React.ComponentType<{ className?: string }>;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (UK)', Flag: FlagUK },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', Flag: FlagNL },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', Flag: FlagIT },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(nextLocale: string) {
    setIsOpen(false);
    if (nextLocale === locale) return;
    router.replace(
      // @ts-expect-error -- pathname is typesafe but the params are not
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Select language"
      >
        <span className="font-mono uppercase text-xs font-bold translate-y-[1px]">{currentLang.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden z-50 py-1"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">
              Language
            </div>
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === locale;
              const FlagComponent = lang.Flag;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FlagComponent className="w-[26px] h-[17.5px] rounded-xs shrink-0 border border-black/15 dark:border-white/15" />
                    <span>{lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TechFilterProps {
  allTechs: string[];
  selectedTechs: string[];
  onChange: (techs: string[]) => void;
}

export default function TechFilter({ allTechs, selectedTechs, onChange }: TechFilterProps) {
  const tCommon = useTranslations('blog');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTech = (tech: string) => {
    if (tech === 'all') {
      onChange([]);
      return;
    }

    if (selectedTechs.includes(tech)) {
      onChange(selectedTechs.filter(t => t !== tech));
    } else {
      onChange([...selectedTechs, tech]);
    }
  };

  const removeTech = (tech: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTechs.filter(t => t !== tech));
  };

  return (
    <div className="relative w-full sm:w-80" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[48px] w-full pl-4 pr-10 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl cursor-pointer focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm hover:border-gray-200 dark:hover:border-gray-700 flex flex-wrap gap-2 items-center"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {selectedTechs.length === 0 && <Filter size={18} />}
        </div>

        {selectedTechs.length === 0 ? (
          <span className="text-sm font-medium text-gray-500 pl-7">{tCommon('all')}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 pl-1 pr-2">
            {selectedTechs.map(tech => (
              <span 
                key={tech} 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800/50 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                {tech}
                <X 
                  size={12} 
                  className="cursor-pointer hover:text-blue-800 dark:hover:text-blue-200" 
                  onClick={(e) => removeTech(tech, e)}
                />
              </span>
            ))}
          </div>
        )}

        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
              <button
                onClick={() => {
                  onChange([]);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                  selectedTechs.length === 0 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {tCommon('all')}
                {selectedTechs.length === 0 && <Check size={16} />}
              </button>
              
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
              
              {allTechs.filter(t => t !== 'all').map(tech => {
                const isSelected = selectedTechs.includes(tech);
                return (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tech}
                    {isSelected && <Check size={16} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

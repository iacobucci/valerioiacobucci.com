'use client';

import { useState, useEffect } from 'react';
import { X, Archive, Zap, Languages } from 'lucide-react';
import { checkTranslationFilesAction } from '@/lib/actions/content-editor';

interface TranslateModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (locales: string[]) => void;
  currentPath: string;
}

export default function TranslateModal({ isOpen, onCancel, onConfirm, currentPath }: TranslateModalProps) {
  const locales = ['en', 'it', 'nl'];
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<Record<string, boolean>>({});
  
  // Extract current locale from path (e.g., path/to/en.mdx)
  const currentLocale = currentPath.split('/').pop()?.split('.').slice(-2, -1)[0] || 'en';
  const availableTargetLocales = locales.filter(l => l !== currentLocale);

  useEffect(() => {
    if (isOpen) {
      checkTranslationFilesAction(currentPath).then(setExistingFiles);
    }
  }, [isOpen, currentPath]);

  if (!isOpen) return null;

  const toggleLocale = (locale: string) => {
    setSelectedLocales(prev => 
      prev.includes(locale) ? prev.filter(l => l !== locale) : [...prev, locale]
    );
  };

  const hasOverlap = selectedLocales.some(l => existingFiles[l]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Translate Article</h3>
            <p className="text-xs text-gray-500 mt-0.5">Translate from <strong>{currentLocale}</strong> using Gemini AI.</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Target Languages</label>
            <div className="grid grid-cols-1 gap-3">
              {availableTargetLocales.map(locale => (
                <label key={locale} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedLocales.includes(locale)
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 hover:border-blue-300'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={selectedLocales.includes(locale)} 
                    onChange={() => toggleLocale(locale)}
                    className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700"
                  />
                  <div className="flex-1">
                    <span className={`block text-sm font-bold ${selectedLocales.includes(locale) ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {locale.toUpperCase()} {locale === 'en' ? '(English)' : locale === 'it' ? '(Italian)' : locale === 'nl' ? '(Dutch)' : ''}
                    </span>
                    {existingFiles[locale] && (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1 mt-0.5">
                        <Archive className="w-3 h-3" /> File already exists
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {hasOverlap && (
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 flex gap-3">
              <Zap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                <strong>Warning:</strong> Some of the selected languages already have a translation file. These files will be <strong>permanently replaced</strong>.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(selectedLocales)}
              disabled={selectedLocales.length === 0}
              className={`px-8 py-2.5 rounded-xl text-white text-sm font-bold transition-all flex items-center gap-2 ${
                hasOverlap 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Languages className="w-4 h-4" />
              {hasOverlap ? 'Overwrite & Translate' : 'Translate Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

interface ColorModeToggleProps {
  initialTheme: 'light' | 'dark' | undefined;
}

export default function ColorModeToggle({ initialTheme }: ColorModeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme || 'light');

  useEffect(() => {
    // If no initial theme was provided (first visit), sync state with what the inline script did
    if (!initialTheme) {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, [initialTheme]);

  useEffect(() => {
    // Don't overwrite if it's the very first render and we are about to sync in the other effect
    // But actually, setTheme triggers a re-render so it's fine.
    
    localStorage.setItem('theme', theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
      aria-label="Toggle color mode"
    >
      {theme === 'dark' ? <MdLightMode className="h-5 w-5" /> : <MdDarkMode className="h-5 w-5" />}
    </button>
  );
}

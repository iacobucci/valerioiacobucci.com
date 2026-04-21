'use client';

import { useEffect, useState } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

interface ColorModeToggleProps {
  initialTheme: 'light' | 'dark';
}

export default function ColorModeToggle({ initialTheme }: ColorModeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    // Sincronizza localStorage e cookie in caso di discrepanze (es. primo caricamento o modifiche esterne)
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

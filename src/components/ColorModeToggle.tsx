'use client';

import { useEffect, useState } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

export default function ColorModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(initialTheme);
    // Assicuriamoci che il cookie sia sincronizzato per i caricamenti successivi
    document.cookie = `theme=${initialTheme}; path=/; max-age=31536000; SameSite=Lax`;
    
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Imposta il cookie per il server
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (theme === null) return <div className="p-2 w-9 h-9" />;

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

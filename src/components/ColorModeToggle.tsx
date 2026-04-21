'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ColorModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Sincronizza immediatamente il DOM (sistema esterno)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Posticipa l'aggiornamento dello stato per evitare render a cascata sincroni (e l'errore di linting)
    const frame = requestAnimationFrame(() => {
      setTheme(initialTheme);
    });
    
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Evita l'idratazione errata mostrando un segnaposto finché il tema non è determinato
  if (theme === null) return <div className="p-2 w-9 h-9" />;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
      aria-label="Toggle color mode"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

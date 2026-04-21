'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ColorModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Defer state update to avoid lint warning about synchronous setState in effect
    const frame = requestAnimationFrame(() => {
      setTheme(initialTheme);
    });
    
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (theme === null) return <div className="p-2 w-9 h-9" />; // Avoid hydration mismatch

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
      aria-label="Toggle color mode"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

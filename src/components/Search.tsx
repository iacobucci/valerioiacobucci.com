'use client';

import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  return (
    <button
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
      aria-label="Search"
    >
      <SearchIcon className="h-5 w-5" />
    </button>
  );
}

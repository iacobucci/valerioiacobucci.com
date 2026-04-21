'use client';

import { MdSearch } from 'react-icons/md';

export default function Search() {
  return (
    <button
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
      aria-label="Search"
    >
      <MdSearch className="h-5 w-5" />
    </button>
  );
}

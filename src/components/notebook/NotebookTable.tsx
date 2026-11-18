'use client';

import React, { useState } from 'react';
import { TableData } from './types';

interface NotebookTableProps {
  data: TableData;
  className?: string;
  pageSize?: number;
}

export const NotebookTable: React.FC<NotebookTableProps> = ({
  data,
  className = '',
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const { columns = [], rows = [] } = data;
  const totalRows = rows.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const startIdx = currentPage * pageSize;
  const pageRows = rows.slice(startIdx, startIdx + pageSize);

  if (columns.length === 0 && rows.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic p-3">Empty table</div>
    );
  }

  return (
    <div className={`my-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800">
              <th className="px-3 py-2 font-mono text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider w-12 text-right select-none">
                #
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 border-l border-gray-200 dark:border-gray-800"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 font-mono">
            {pageRows.map((row, rIdx) => {
              const actualIdx = startIdx + rIdx;
              return (
                <tr
                  key={actualIdx}
                  className="even:bg-gray-50/50 dark:even:bg-gray-900/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <td className="px-3 py-2 text-[10px] text-gray-400 dark:text-gray-600 text-right select-none font-medium">
                    {actualIdx}
                  </td>
                  {row.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-4 py-2 text-gray-800 dark:text-gray-200 border-l border-gray-100 dark:border-gray-800/60 whitespace-nowrap"
                    >
                      {val === null || val === undefined
                        ? <span className="text-gray-400 italic">null</span>
                        : typeof val === 'boolean'
                        ? <span className="text-amber-600 dark:text-amber-400">{String(val)}</span>
                        : typeof val === 'number'
                        ? <span className="text-blue-600 dark:text-blue-400">{val}</span>
                        : String(val)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 select-none">
          <span>
            Showing {startIdx + 1}–{Math.min(startIdx + pageSize, totalRows)} of {totalRows} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              Prev
            </button>
            <span className="px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

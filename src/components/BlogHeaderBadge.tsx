'use client';

import { useDrafts } from './DraftsContext';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

interface BlogHeaderBadgeProps {
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  isAuthorized: boolean;
}

export default function BlogHeaderBadge({
  totalCount,
  publishedCount,
  draftCount,
  isAuthorized
}: BlogHeaderBadgeProps) {
  const t = useTranslations('blog');
  const { showDrafts, setShowDrafts } = useDrafts();

  if (!isAuthorized) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80">
        <FileText className="w-3.5 h-3.5 text-blue-500" />
        <span>{t('count_public', { count: publishedCount })}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80">
      <FileText className="w-3.5 h-3.5 text-blue-500" />
      <span>
        {showDrafts
          ? t('count_admin', { total: totalCount, published: publishedCount, drafts: draftCount })
          : t('count_public', { count: publishedCount })}
      </span>
      <button
        onClick={() => setShowDrafts(!showDrafts)}
        className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
          showDrafts
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title={showDrafts ? "Switch to Visitor View (hide drafts)" : "Switch to Admin View (show drafts)"}
      >
        {showDrafts ? <MdVisibility className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <MdVisibilityOff className="w-3 h-3 text-gray-500" />}
        <span>{showDrafts ? 'Admin' : 'Visitor'}</span>
      </button>
    </div>
  );
}

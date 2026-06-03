'use client';

import Giscus, { type Repo, type AvailableLanguage } from '@giscus/react';
import { useTheme } from '@/hooks/useTheme';

interface CommentsProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  lang: string;
}

export default function Comments({ repo, repoId, category, categoryId, lang }: CommentsProps) {
  const theme = useTheme();

  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 min-h-[300px]">
      <Giscus
        id="comments"
        repo={repo as Repo}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme === 'dark' ? 'transparent_dark' : 'light'}
        lang={lang as AvailableLanguage}
        loading="lazy"
      />
    </div>
  );
}

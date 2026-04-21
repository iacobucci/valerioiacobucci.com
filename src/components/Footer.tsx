import { useTranslations } from 'next-intl';
import { RiNextjsFill } from 'react-icons/ri';

export default function Footer({ commitHash }: { commitHash: string }) {
  const t = useTranslations('footer');

  return (
    <footer className="w-full py-8 px-6 border-t border-gray-100 dark:border-gray-800 bg-bg-light dark:bg-bg-dark">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>{t('made_with')}</span>
          <RiNextjsFill className="w-5 h-5 text-fg-light dark:text-fg-dark" />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="opacity-50">commit</span>
          <a 
            href={`https://github.com/iacobucci/valerioiacobucci.com/commit/${commitHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-light dark:hover:text-accent-dark transition-colors"
          >
            {commitHash}
          </a>
        </div>
      </div>
    </footer>
  );
}

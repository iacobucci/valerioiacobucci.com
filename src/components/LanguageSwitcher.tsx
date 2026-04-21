'use client';

import { useLocale } from 'next-intl';
import { routing, usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function onSelectChange(nextLocale: string) {
    router.replace(
      // @ts-expect-error -- pathname is typesafe but the params are not
      { pathname, params },
      { locale: nextLocale }
    );
  }

  return (
    <div className="flex gap-2">
      {routing.locales.map((cur) => (
        <button
          key={cur}
          onClick={() => onSelectChange(cur)}
          className={`px-2 py-1 text-xs font-medium rounded ${
            locale === cur
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {cur.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

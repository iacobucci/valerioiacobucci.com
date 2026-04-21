import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import ContentList from '@/components/ContentList';

export default async function FavoritesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('favorites');

  const favorites = await getPosts('favorites', locale);

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-4xl mx-auto py-20 px-6 sm:px-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-fg-light dark:text-fg-dark mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </header>
        
        <ContentList items={favorites} type="favorites" />
      </main>
    </div>
  );
}

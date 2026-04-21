import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMicroblogPosts } from '@/lib/microblog';
import MicroblogList from '@/components/MicroblogList';

export default async function MicroblogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('microblog');

  const posts = await getMicroblogPosts(50);

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-2xl mx-auto py-20 px-6 sm:px-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-fg-light dark:text-fg-dark mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </header>

        <MicroblogList 
          posts={posts} 
          locale={locale} 
          noPostsMessage={t('no_posts')} 
        />
      </main>
    </div>
  );
}

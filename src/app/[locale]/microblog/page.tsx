import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMicroblogPosts } from '@/lib/microblog';
import MicroblogPostCard from '@/components/MicroblogPostCard';

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

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <MicroblogPostCard key={post.id} post={post} locale={locale} />
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t('no_posts')}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

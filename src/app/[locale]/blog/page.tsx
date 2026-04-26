import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import ContentList from '@/components/ContentList';
import { Metadata } from 'next';
import { isAuthorized } from '@/auth';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('blog');

  const authorized = await isAuthorized();
  const posts = await getPosts('blog', locale, authorized);

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-6xl mx-auto py-20 px-6">
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-fg-light dark:text-fg-dark mb-6 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('description')}
          </p>
        </header>
        
        <div className="max-w-4xl mx-auto">
          <ContentList items={posts} type="blog" locale={locale} />
        </div>
      </main>
    </div>
  );
}

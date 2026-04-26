import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMicroblogPosts } from '@/lib/microblog';
import MicroblogList from '@/components/MicroblogList';
import { auth } from '@/auth';
import MicroblogEditor from '@/components/MicroblogEditor';
import { Suspense } from 'react';
import MicroblogSkeleton from '@/components/MicroblogSkeleton';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'microblog' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

async function MicroblogListWrapper({ locale, noPostsMessage }: { locale: string, noPostsMessage: string }) {
  const posts = await getMicroblogPosts(20, 0);
  return <MicroblogList posts={posts} locale={locale} noPostsMessage={noPostsMessage} />;
}

export default async function MicroblogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('microblog');
  const session = await auth();
  const user = session?.user as { email?: string | null; username?: string } | undefined;

  // Controllo autorizzazione basato su email o username GitHub
  const isAuthor = 
    user?.email?.toLowerCase().trim() === 'iacobuccivalerio@gmail.com' ||
    user?.username === 'iacobucci';

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

        <div className="max-w-2xl mx-auto">
          {isAuthor && <MicroblogEditor />}

          <Suspense fallback={<MicroblogSkeleton />}>
            <MicroblogListWrapper locale={locale} noPostsMessage={t('no_posts')} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

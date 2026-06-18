import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getMicroblogPost, getMicroblogPostByHash } from '@/lib/microblog';
import MicroblogPostCard from '@/components/MicroblogPostCard';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { MdArrowBack } from 'react-icons/md';
import { Metadata } from 'next';
import { MicroblogPostSerializable } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function fetchPost(param: string): Promise<{ post: MicroblogPostSerializable | null; displayId: string }> {
  // Check if param is a numeric ID
  if (/^\d+$/.test(param)) {
    const dbId = parseInt(param) + 1;
    const post = await getMicroblogPost(dbId);
    return { post, displayId: `#${param}` };
  }
  
  // Otherwise treat as hash
  const post = await getMicroblogPostByHash(param);
  return { post, displayId: '' };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const { post, displayId } = await fetchPost(id);
  
  if (!post) return {};

  const baseUrl = process.env.AUTH_URL || 'https://valerioiacobucci.com';
  const url = `${baseUrl}/${locale}/microblog/${id}`;
  const title = `Microblog Post ${displayId}`.trim();
  const description = post.content.slice(0, 160);
  
  const ogImage = post.image_data ? `${baseUrl}/api/microblog/${id}/image` : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.created_at,
      locale: locale,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    }
  };
}

export default async function MicroblogPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('microblog');

  const { post, displayId } = await fetchPost(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-2xl mx-auto py-20 px-6 sm:px-12">
        <header className="mb-12">
          <Link 
            href="/microblog" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-8 group"
          >
            <MdArrowBack className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t('back_to_microblog')}
          </Link>
          <h1 className="text-3xl font-bold text-fg-light dark:text-fg-dark">
            Post {displayId}
          </h1>
        </header>

        <div className="card-enter">
          <MicroblogPostCard post={post} locale={locale} isIndividualPage />
        </div>
      </main>
    </div>
  );
}

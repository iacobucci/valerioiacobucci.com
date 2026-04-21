import {getPost, getPosts} from '@/lib/content';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/routing';
import {ArrowLeft} from 'lucide-react';

import {MDXRemote} from 'next-mdx-remote/rsc';
import {mdxComponents} from '@/components/mdx-components';
import {routing} from '@/i18n/routing';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

const CONTENT_TYPE = 'favorites';

export async function generateStaticParams() {
  const locales = routing.locales;
  const allParams: {locale: string; slug: string}[] = [];

  for (const locale of locales) {
    const posts = await getPosts(CONTENT_TYPE, locale);
    posts.forEach((post) => {
      allParams.push({
        locale,
        slug: post.slug,
      });
    });
  }

  return allParams;
}

export default async function FavoritePage({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  
  setRequestLocale(locale);

  // Trigger HMR by telling the bundler to watch the file
  if (process.env.NODE_ENV === 'development') {
    try {
      await import(`@/../content/${CONTENT_TYPE}/${slug}/${locale}.mdx`);
    } catch (e) {
      // Ignore errors, we only want the watcher to register the dependency
    }
  }
  
  const post = await getPost(CONTENT_TYPE, locale, slug);

  if (!post) {
    notFound();
  }

  const t = await getTranslations('favorites');

  // Custom components to handle relative paths for this specific post
  const components = {
    ...mdxComponents,
    ModelViewer: (props: { url: string; [key: string]: unknown }) => {
      let url = props.url;
      if (url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
        const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
        url = `/assets/${CONTENT_TYPE}/${slug}/${normalizedUrl}`;
      }
      return <ModelViewerWrapper {...props} url={url} />;
    },
    img: ({ src, alt, ...props }: any) => {
      let finalSrc = src;
      if (src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
        finalSrc = `/assets/${CONTENT_TYPE}/${slug}/${normalizedSrc}`;
      }
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...props} src={finalSrc} alt={alt} className="rounded-lg my-8 w-full" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <article>
        <header className="mb-12">
          <Link
            href="/favorites"
            className="text-gray-900 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white transition-colors inline-flex items-center mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Link>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>
          {post.isFallback && (
            <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-8 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200" role="alert">
              <p className="font-bold">Info</p>
              <p>{t('fallback_warning')}</p>
            </div>
          )}
        </header>

        <div className="prose prose-neutral prose-lg dark:prose-invert max-w-none">
          <MDXRemote source={post.content} components={components} />
        </div>
      </article>
    </div>
  );
}

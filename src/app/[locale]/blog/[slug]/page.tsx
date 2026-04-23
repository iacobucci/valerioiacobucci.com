import {getPost, getPosts} from '@/lib/content';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/routing';
import {ArrowLeft} from 'lucide-react';
import {FormattedDate} from '@/components/FormattedDate';
import {MdLanguage} from 'react-icons/md';

import {MDXRemote} from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import {mdxComponents} from '@/components/mdx-components';
import {routing} from '@/i18n/routing';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

const CONTENT_TYPE = 'blog';

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

export default async function BlogPostPage({
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
    } catch {
      // Ignore errors, we only want the watcher to register the dependency
    }
  }
  
  const post = await getPost(CONTENT_TYPE, locale, slug);

  if (!post || (post.draft && process.env.NODE_ENV !== 'development')) {
    notFound();
  }

  const t = await getTranslations('blog');

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
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
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
            href="/blog"
            className="text-gray-900 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white transition-colors inline-flex items-center mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Link>
          
          {post.isFallback && (
            <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-start gap-3 text-orange-800 dark:text-orange-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <MdLanguage className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">
                {t('fallback_warning')}
              </p>
            </div>
          )}

          {post.draft && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3 text-red-800 dark:text-red-200 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-widest">
                {t('draft_badge')}
              </p>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mt-4 mb-8 leading-relaxed font-medium">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500 dark:text-gray-400">
            {post.date && (
              <div className="flex items-center gap-1.5" title="Published date">
                <FormattedDate date={post.date} locale={locale} />
              </div>
            )}
            {post.updated && (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium" title="Last updated">
                <span className="text-[10px] uppercase tracking-wider">Updated:</span>
                <FormattedDate date={post.updated} locale={locale} />
              </div>
            )}
            {post.readingTime && (
              <span>• {t('reading_time', {time: post.readingTime})}</span>
            )}
            <div className="flex gap-2">
              {post.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className="prose prose-neutral prose-lg dark:prose-invert max-w-none">
          <MDXRemote 
            source={post.content} 
            components={components} 
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>
      </article>
    </div>
  );
}

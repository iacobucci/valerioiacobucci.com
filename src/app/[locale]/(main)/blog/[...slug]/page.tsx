import {getPost, getPosts} from '@/lib/content';
import {notFound, redirect} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/routing';
import {ArrowLeft} from 'lucide-react';
import {FormattedDate} from '@/components/FormattedDate';
import {MdLanguage, MdEdit} from 'react-icons/md';
import { Metadata } from 'next';
import { isAuthorized } from '@/auth';

import {MDXRemote} from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import {rehypeMermaid} from '@/lib/mdx';
import {serverMdxComponents} from '@/components/mdx-server-components';
import {routing} from '@/i18n/routing';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import Video from '@/components/mdx/Video';
import SongPlayer from '@/components/mdx/SongPlayer';
import ShareDraftButton from '@/components/ShareDraftButton';
import Comments from '@/components/Comments';
import TableOfContents from '@/components/TableOfContents';
import { extractToc } from '@/lib/toc';
import * as path from 'path';
import { getSvgDimensions } from '@/lib/image-utils-server';
import { loadNotebook } from '@/lib/notebooks';
import { Notebook } from '@/components/notebook';

const CONTENT_TYPE = 'blog';

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string; slug: string | string[]}>;
}): Promise<Metadata> {
  const {locale: rawLocale, slug: rawSlug} = await params;
  const slugParts = Array.isArray(rawSlug) ? [...rawSlug] : [rawSlug];
  let locale = rawLocale;
  if ((routing.locales as readonly string[]).includes(slugParts[0])) {
    locale = slugParts.shift()!;
  }
  let slug = slugParts.join('/');
  let post = await getPost(CONTENT_TYPE, locale, slug);
  if (!post && !slug.includes('/')) {
    const allPosts = await getPosts(CONTENT_TYPE, locale, true);
    const matched = allPosts.find(p => p.slug.endsWith(`/${slug}`));
    if (matched) {
      slug = matched.slug;
      post = matched;
    }
  }

  if (!post) {
    return {};
  }

  const baseUrl = process.env.AUTH_URL || 'https://valerioiacobucci.com';
  const url = locale === routing.defaultLocale
    ? `${baseUrl}/blog/${slug}`
    : `${baseUrl}/${locale}/blog/${slug}`;
  
  let ogImage = undefined;
  if (post.cover) {
    if (post.cover.startsWith('http')) {
      ogImage = post.cover;
    } else if (post.cover.startsWith('/')) {
      ogImage = `${baseUrl}${post.cover}`;
    } else {
      const coverPath = post.cover.startsWith('./') ? post.cover.slice(2) : post.cover;
      ogImage = `${baseUrl}/assets/${CONTENT_TYPE}/${slug}/${coverPath}`;
    }
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: ['Valerio Iacobucci'],
      locale: locale,
      ...(ogImage ? {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          }
        ]
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const locales = routing.locales;
  const allParams: {locale: string; slug: string[]}[] = [];

  for (const locale of locales) {
    const posts = await getPosts(CONTENT_TYPE, locale);
    posts.forEach((post) => {
      allParams.push({
        locale,
        slug: post.slug.split('/'),
      });
    });
  }

  return allParams;
}

export default async function BlogPostPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string; slug: string | string[]}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const {locale: rawLocale, slug: rawSlug} = await params;
  const slugParts = Array.isArray(rawSlug) ? [...rawSlug] : [rawSlug];
  
  if ((routing.locales as readonly string[]).includes(slugParts[0])) {
    const targetLocale = slugParts.shift()!;
    const actualSlug = slugParts.join('/');
    const targetUrl = targetLocale === routing.defaultLocale
      ? `/blog/${actualSlug}`
      : `/${targetLocale}/blog/${actualSlug}`;
    redirect(targetUrl);
  }

  const locale = rawLocale;
  const slug = slugParts.join('/');
  const { pwd } = await searchParams;
  
  setRequestLocale(locale);
  
  // Trigger HMR by telling the bundler to watch the file
  if (process.env.NODE_ENV === 'development') {
    try {
      if (CONTENT_TYPE === 'blog') {
        await import(`@/../content/${slug}/${locale}.mdx`);
      } else {
        await import(`@/../content/${CONTENT_TYPE}/${slug}/${locale}.mdx`);
      }
    } catch {
      // Ignore errors, we only want the watcher to register the dependency
    }
  }
  
  const post = await getPost(CONTENT_TYPE, locale, slug);
  if (!post && !slug.includes('/')) {
    const allPosts = await getPosts(CONTENT_TYPE, locale, true);
    const matched = allPosts.find(p => p.slug.endsWith(`/${slug}`));
    if (matched) {
      const targetUrl = locale === routing.defaultLocale
        ? `/blog/${matched.slug}`
        : `/${locale}/blog/${matched.slug}`;
      redirect(targetUrl);
    }
  }

  const authorized = await isAuthorized();

  const isPreviewValid = post?.preview && (
    !post.preview_passcode || 
    (typeof pwd === 'string' && pwd === post.preview_passcode)
  );

  if (!post || (post.draft && !authorized && !isPreviewValid && process.env.NODE_ENV !== 'development')) {
    notFound();
  }

  const t = await getTranslations('blog');

  const version = (post.updated || post.date) ? new Date(post.updated || post.date || '').getTime() : '';
  
  // Custom components to handle relative paths for this specific post
  const components = {
    ...serverMdxComponents,
    ModelViewer: (props: { url: string; [key: string]: unknown }) => {
      let url = props.url;
      if (url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
        const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
        url = `/assets/${CONTENT_TYPE}/${slug}/${normalizedUrl}`;
        if (version) {
          url += `?v=${version}`;
        }
      }
      return <ModelViewerWrapper {...props} url={url} />;
    },
    img: ({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      let finalSrc = src;
      let localPath = '';

      if (src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
        finalSrc = `/assets/${CONTENT_TYPE}/${slug}/${normalizedSrc}`;
        localPath = path.join(process.cwd(), 'content', slug, normalizedSrc);
        if (version) {
          finalSrc += `?v=${version}`;
        }
      }

      const isSvg = typeof finalSrc === 'string' && finalSrc.split('?')[0].toLowerCase().endsWith('.svg');

      if (isSvg && typeof finalSrc === 'string') {
        const dimensions = localPath ? getSvgDimensions(localPath) : null;
        const style = dimensions?.aspectRatio ? { aspectRatio: `${dimensions.aspectRatio}` } : {};

        return (
          <span className={className || "mdx-img overflow-hidden bg-gray-50 dark:bg-gray-900/50 block"} style={style}>
            <object 
              data={finalSrc} 
              type="image/svg+xml" 
              className="w-full h-full block"
              aria-label={alt}
            >
              {alt}
            </object>
          </span>
        );
      }

      // eslint-disable-next-line @next/next/no-img-element
      return <img src={finalSrc as string} alt={alt} className={className || "mdx-img"} {...props} />;
    },
    Video: (props: React.ComponentProps<typeof Video>) => <Video {...props} assetPath={`/assets/${CONTENT_TYPE}/${slug}`} />,
    Song: (props: React.ComponentProps<typeof SongPlayer>) => <SongPlayer {...props} assetPath={`/assets/${CONTENT_TYPE}/${slug}`} />,
    Music: (props: React.ComponentProps<typeof SongPlayer>) => <SongPlayer {...props} assetPath={`/assets/${CONTENT_TYPE}/${slug}`} />,
    Notebook: (props: React.ComponentProps<typeof Notebook>) => {
      let initialData = props.initialData;
      let resolvedPath = props.resolvedPath;
      if (props.src && !initialData) {
        const res = loadNotebook(props.src, slug);
        if (res.data) {
          initialData = res.data;
          resolvedPath = res.relativePath;
        }
      }
      return (
        <Notebook
          {...props}
          initialData={initialData}
          resolvedPath={resolvedPath}
          slug={slug}
          isAuthor={authorized}
        />
      );
    },
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <article>
        <header className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <Link
              href="/blog"
              className="text-gray-900 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white transition-colors inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back')}
            </Link>

            <div className="flex items-center gap-2">
              {authorized && post.draft && (
                <ShareDraftButton 
                  slug={post.slug} 
                  locale={locale} 
                  passcode={post.preview_passcode} 
                  isPreviewEnabled={!!post.preview} 
                />
              )}
              {authorized && (
                <Link
                  href={`/admin/editor?path=${post.slug}/${post.language}.mdx`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
                >
                  <MdEdit className="w-4 h-4" />
                  Edit Post
                </Link>
              )}
            </div>
          </div>
          
          {post.isFallback && (
            <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl flex items-start gap-3 text-orange-800 dark:text-orange-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <MdLanguage className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">
                {t('fallback_warning')} ({post.language.toUpperCase()})
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

          {post.category && (
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wider">
              <span>{post.category}</span>
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
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                >
                  #{tag.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Translation Review Status Tag */}
            {post.reviewed === false ? (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                title="This translation was generated automatically by AI and is unreviewed."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('unreviewed_translation_badge')}</span>
              </span>
            ) : post.language !== 'en' ? (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                title="This translation has been reviewed."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{t('reviewed_translation_badge')}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                title="Original language (reviewed)"
              >
                <span>{t('reviewed_badge')}</span>
              </span>
            )}
          </div>

          {/* Informative notice if translation is unreviewed */}
          {post.reviewed === false && (
            <div className="my-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
              <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <MdLanguage className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold">{t('unreviewed_translation_title')}:</span>{' '}
                <span>{t('unreviewed_translation_desc')}</span>
              </div>
            </div>
          )}

          {(post.song || post.music) && (
            <div className="mt-6">
              <SongPlayer
                title={typeof post.song === 'object' ? (post.song as any).title : undefined}
                artist={typeof post.song === 'object' ? (post.song as any).artist : undefined}
                src={typeof post.song === 'string' ? post.song : ((post.song as any)?.src || (post.music as string))}
                assetPath={`/assets/${CONTENT_TYPE}/${slug}`}
              />
            </div>
          )}
        </header>

        <TableOfContents items={extractToc(post.content)} />

        <div className="prose prose-neutral prose-lg dark:prose-invert max-w-none">
          <MDXRemote 
            source={post.content} 
            components={components} 
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeMermaid,
                  [
                    rehypePrettyCode,
                    {
                      theme: {
                        dark: 'github-dark',
                        light: 'github-light',
                      },
                      keepBackground: false,
                    },
                  ],
                ],
              },
            }}
          />
        </div>
      </article>

      {process.env.NEXT_PUBLIC_GISCUS_REPO && (
        <Comments 
          repo={process.env.NEXT_PUBLIC_GISCUS_REPO}
          repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID || ''}
          category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY || ''}
          categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || ''}
          lang={locale}
          term={slug}
        />
      )}
    </div>
  );
}

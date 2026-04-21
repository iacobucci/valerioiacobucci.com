import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPostMDX } from '@/lib/mdx';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
	const blogDir = path.join(process.cwd(), 'content/blog');
	const slugs = fs.readdirSync(blogDir).filter(file =>
		fs.statSync(path.join(blogDir, file)).isDirectory()
	);

	const locales = ['en', 'it', 'nl'];

	return slugs.flatMap(slug =>
		locales.map(locale => ({ locale, slug }))
	);
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;

	setRequestLocale(locale);
	const t = await getTranslations('blog');

	const result = await getPostMDX(slug, locale);

	if (!result) notFound();

	const { content, isFallback } = result;
	const Content = content.default;

	const components = {
		ModelViewer: (props: { url: string; [key: string]: unknown }) => {
			let url = props.url;
			if (url && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
				const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
				url = `/blog-images/${slug}/${normalizedUrl}`;
			}
			return <ModelViewerWrapper {...props} url={url} />;
		},
		img: ({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
			let finalSrc = src;
			// If src is relative (doesn't start with http, / or data:)
			if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
				// Normalize: remove ./ if present
				const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
				finalSrc = `/blog-images/${slug}/${normalizedSrc}`;
			}
			// eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
			return <img {...props} src={finalSrc} />;
		}
	};

	return (
		<article className="max-w-3xl mx-auto py-20 px-6 prose dark:prose-invert">
			{isFallback && (
				<div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-8 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200" role="alert">
					<p className="font-bold">Info</p>
					<p>{t('fallback_warning')}</p>
				</div>
			)}
			<Content components={components} />
		</article>
	);
}

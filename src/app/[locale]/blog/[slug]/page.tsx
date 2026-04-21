import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPostMDX } from '@/lib/mdx';

export async function generateStaticParams() {
	return [
		{ locale: 'en', slug: 'first-post' },
		{ locale: 'it', slug: 'first-post' },
		{ locale: 'nl', slug: 'first-post' },
	];
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

	return (
		<article className="max-w-3xl mx-auto py-20 px-6 prose dark:prose-invert">
			{isFallback && (
				<div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-8 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200" role="alert">
					<p className="font-bold">Info</p>
					<p>{t('fallback_warning')}</p>
				</div>
			)}
			<Content />
		</article>
	);
}

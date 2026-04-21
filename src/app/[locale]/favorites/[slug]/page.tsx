import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getContentMDX } from '@/lib/mdx';
import ContentRenderer from '@/components/mdx/ContentRenderer';

import fs from 'fs';
import path from 'path';

const CONTENT_TYPE = 'favorites';

export async function generateStaticParams() {
	const contentDir = path.join(process.cwd(), 'content', CONTENT_TYPE);
	if (!fs.existsSync(contentDir)) return [];

	const slugs = fs.readdirSync(contentDir).filter(file =>
		fs.statSync(path.join(contentDir, file)).isDirectory()
	);

	const locales = ['en', 'it', 'nl'];

	return slugs.flatMap(slug =>
		locales.map(locale => ({ locale, slug }))
	);
}

export default async function FavoritePage({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;

	setRequestLocale(locale);
	const t = await getTranslations('favorites');

	const result = await getContentMDX(CONTENT_TYPE, slug, locale);

	if (!result) notFound();

	const { content, isFallback } = result;
	const Content = content.default;

	return (
		<article className="max-w-4xl mx-auto py-20 px-6 prose prose-indigo dark:prose-invert">
			{isFallback && (
				<div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-8 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200" role="alert">
					<p className="font-bold">Info</p>
					<p>{t('fallback_warning')}</p>
				</div>
			)}
			<ContentRenderer Content={Content} contentType={CONTENT_TYPE} slug={slug} />
		</article>
	);
}

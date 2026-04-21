import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
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

	const post = await getPostMDX(slug, locale);

	if (!post) notFound();

	const Content = post.default;

	return (
		<article className="max-w-3xl mx-auto py-20 px-6 prose dark:prose-invert">
			<Content />
		</article>
	);
}
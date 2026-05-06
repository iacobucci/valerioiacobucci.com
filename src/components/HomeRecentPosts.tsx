import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdHistory } from 'react-icons/md';
import BlogPostCard from './BlogPostCard';

export default async function HomeRecentPosts({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const tBlog = await getTranslations('blog');

	const blogPosts = await getPosts('blog', locale);
	const recentPosts = blogPosts
		.filter(post => !post.selected && !post.draft)
		.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			return dateB - dateA;
		})
		.slice(0, 3);

    if (recentPosts.length === 0) return null;

	return (
		<section className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12 snap-section">
			<div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
				<div className="space-y-2">
					<h2 className="text-3xl font-black text-fg-light dark:text-fg-dark flex items-center gap-3">
						<MdHistory className="text-blue-500" />
						{tBlog('recent_title')}
					</h2>
					<p className="text-gray-500 dark:text-gray-400 font-medium">
						{tBlog('recent_description')}
					</p>
				</div>
				<Link 
					href="/blog" 
					className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all"
				>
					{tBlog('view_all')} <MdArrowForward />
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{recentPosts.map((post) => (
					<BlogPostCard key={post.slug} post={post} locale={locale} />
				))}
			</div>

			<div className="sm:hidden flex justify-center pt-8">
				<Link 
					href="/blog" 
					className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-fg-light dark:text-fg-dark font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
				>
					{tBlog('view_all')} <MdArrowForward />
				</Link>
			</div>
		</section>
	);
}

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import { FormattedDate } from '@/components/FormattedDate';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { MdArrowForward, MdStar } from 'react-icons/md';

export default async function HomeFavoritePosts({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const tBlog = await getTranslations('blog');

	const blogPosts = await getPosts('blog', locale);
	const favoritePosts = blogPosts
		.filter(post => post.tags?.includes('favorites') && !post.draft)
		.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			return dateB - dateA;
		})
		.slice(0, 3);

    if (favoritePosts.length === 0) return null;

	return (
		<section className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12 snap-section">
			<div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
				<div className="space-y-2">
					<h2 className="text-3xl font-black text-fg-light dark:text-fg-dark flex items-center gap-3">
						<MdStar className="text-yellow-500" />
						{tBlog('favorites_title')}
					</h2>
					<p className="text-gray-500 dark:text-gray-400 font-medium">
						{tBlog('favorites_description')}
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
				{favoritePosts.map((post) => {
					let finalCover = post.coverImage;
					if (typeof finalCover === 'string' && !finalCover.startsWith('http') && !finalCover.startsWith('/')) {
						finalCover = `/assets/blog/${post.slug}/${finalCover.startsWith('./') ? finalCover.slice(2) : finalCover}`;
					}
					
					return (
						<Link 
							key={post.slug}
							href={`/blog/${post.slug}`}
							className="group flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2"
						>
							{finalCover && (
								<div className="relative h-48 w-full overflow-hidden">
									<Image 
										src={finalCover as string}
										alt={post.title}
										fill
										priority={true}
										className="object-cover group-hover:scale-110 transition-transform duration-500"
									/>
								</div>
							)}
							<div className="p-6 flex flex-col flex-1">
								<div className="flex gap-2 mb-3">
									{post.tags?.slice(0, 2).map(tag => (
										<span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
											#{tag}
										</span>
									))}
								</div>
								<h3 className="text-xl font-bold text-fg-light dark:text-fg-dark mb-2 group-hover:text-blue-600 transition-colors">
									{post.title}
								</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
									{post.description}
								</p>
								<div className="mt-auto text-xs font-bold text-gray-400">
									<FormattedDate date={post.date || ''} locale={locale} />
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
}

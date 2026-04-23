import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import { FormattedDate } from '@/components/FormattedDate';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { MdArrowForward, MdStar, MdTimer } from 'react-icons/md';

export default async function HomeFavoritePosts({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const tBlog = await getTranslations('blog');

	// Include drafts if they are favorites
	const blogPosts = await getPosts('blog', locale, true);
	const favoritePosts = blogPosts
		.filter(post => post.favorite)
		.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			return dateB - dateA;
		});

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

			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[240px]">
				{favoritePosts.map((post, idx) => {
					let finalCover = post.coverImage;
					if (typeof finalCover === 'string' && !finalCover.startsWith('http') && !finalCover.startsWith('/')) {
						finalCover = `/assets/blog/${post.slug}/${finalCover.startsWith('./') ? finalCover.slice(2) : finalCover}`;
					}
					
					// Bento grid logic: 
					// First post or drafts with cover image get more space
					const isLarge = idx === 0 || (post.draft && finalCover);
					const cardClass = isLarge 
						? "md:col-span-2 md:row-span-2" 
						: "md:col-span-1 md:row-span-1";

					const CardContent = (
						<div className="relative h-full w-full p-8 flex flex-col justify-end overflow-hidden">
							{finalCover && (
								<>
									<div className="absolute inset-0">
										<Image 
											src={finalCover as string}
											alt={post.title}
											fill
											priority={idx < 2}
											className="object-cover group-hover:scale-105 transition-transform duration-700"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
									</div>
								</>
							)}

							<div className="relative z-10 space-y-3">
								<div className="flex flex-wrap gap-2">
									{post.draft ? (
										<span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">
											<MdTimer className="text-lg" />
											{tBlog('coming_soon')}
										</span>
									) : (
										post.tags?.slice(0, 2).map(tag => (
											<span key={tag} className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
												#{tag}
											</span>
										))
									)}
								</div>
								
								<h3 className={`${isLarge ? 'text-3xl' : 'text-xl'} font-bold text-white leading-tight`}>
									{post.title}
								</h3>
								
								{!post.draft && (
									<p className={`text-gray-200 line-clamp-2 ${isLarge ? 'text-base' : 'text-sm'} font-medium`}>
										{post.description}
									</p>
								)}

								<div className="flex items-center justify-between pt-2">
									<div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
										{!post.draft && post.date && <FormattedDate date={post.date} locale={locale} />}
									</div>
									{!post.draft && <MdArrowForward className="text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />}
								</div>
							</div>
						</div>
					);

					if (post.draft) {
						return (
							<div 
								key={post.slug}
								className={`${cardClass} relative bg-gray-900 rounded-[2.5rem] border border-gray-800 overflow-hidden cursor-default`}
							>
								{CardContent}
							</div>
						);
					}

					return (
						<Link 
							key={post.slug}
							href={`/blog/${post.slug}`}
							className={`${cardClass} group relative bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all`}
						>
							{!finalCover && <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900" />}
							{CardContent}
						</Link>
					);
				})}
			</div>
		</section>
	);
}

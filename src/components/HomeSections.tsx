import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPosts } from '@/lib/content';
import { getMicroblogPosts } from '@/lib/microblog';
import { projects, getGitHubData, ProjectGitHubData } from '@/lib/projects';
import ProjectCard from '@/components/ProjectCard';
import ProjectCarousel from '@/components/ProjectCarousel';
import MicroblogPostCard from '@/components/MicroblogPostCard';
import { FormattedDate } from '@/components/FormattedDate';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { MdArrowForward, MdStar, MdHistoryEdu, MdRocketLaunch } from 'react-icons/md';
import { FaRss } from 'react-icons/fa6';

export default async function HomeSections({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const t = await getTranslations();
	const tMicro = await getTranslations('microblog');
	const tProjects = await getTranslations('projects');
	const tBlog = await getTranslations('blog');

	// Fetch data
	const blogPosts = await getPosts('blog', locale);
	const favoritePosts = blogPosts
		.filter(post => post.tags?.includes('favorites'))
		.sort((a, b) => {
			const dateA = a.date ? new Date(a.date).getTime() : 0;
			const dateB = b.date ? new Date(b.date).getTime() : 0;
			return dateB - dateA;
		})
		.slice(0, 3);

	const microblogPosts = await getMicroblogPosts(3, 0);

	const allProjectsData = await Promise.all(
		projects.map(async (project) => {
			const githubData = await getGitHubData(project.github_repo);
			return {
				...project,
				stars: githubData.stars || 0,
				forks: githubData.forks || 0,
				github_url: githubData.github_url || `https://github.com/${project.github_repo}`,
				language: githubData.language,
				last_commit: githubData.last_commit || '',
				commits: 0,
			} as ProjectGitHubData;
		})
	);

	return (
		<div id="main-content" className="w-full py-24 space-y-32">
			{/* Favorite Blog Posts */}
			{favoritePosts.length > 0 && (
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
			)}

			{/* Latest Projects Carousel */}
			<section className="space-y-12 snap-section">
				<div className="max-w-7xl mx-auto px-6 sm:px-12 flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
					<div className="space-y-2">
						<h2 className="text-3xl font-black text-fg-light dark:text-fg-dark flex items-center gap-3">
							<MdRocketLaunch className="text-orange-500" />
							{tProjects('featured_title')}
						</h2>
						<p className="text-gray-500 dark:text-gray-400 font-medium">
							{tProjects('featured_description')}
						</p>
					</div>
					<Link 
						href="/projects" 
						className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all"
					>
						{tProjects('view_all')} <MdArrowForward />
					</Link>
				</div>

				<ProjectCarousel projects={allProjectsData} />
			</section>

			{/* Microblog Section */}
			<section className="bg-gray-50 dark:bg-gray-900/50 py-24 snap-section">
				<div className="max-w-4xl mx-auto px-6 sm:px-12 space-y-16">
					<div className="text-center space-y-4">
						<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-widest">
							<MdHistoryEdu /> {tMicro('title')}
						</div>
						<h2 className="text-4xl sm:text-5xl font-black text-fg-light dark:text-fg-dark tracking-tight">
							Latest Updates
						</h2>
						<p className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-xl mx-auto">
							{tMicro('description')}
						</p>
					</div>

					<div className="space-y-8 relative">
						<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent hidden sm:block" />
						{microblogPosts.map((post) => (
							<div key={post.id} className="relative z-10">
								<MicroblogPostCard post={post} locale={locale} />
							</div>
						))}
					</div>

					<div className="text-center">
						<Link 
							href="/microblog" 
							className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-fg-light dark:text-fg-dark font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
						>
							{tMicro('view_all')} <MdArrowForward />
						</Link>
					</div>
				</div>
			</section>

			{/* Final CTA / CV Section */}
			<section className="max-w-7xl mx-auto px-6 sm:px-12 pb-24 snap-section">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
					<div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 sm:p-16 border-2 border-fg-light dark:border-gray-800 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] flex flex-col justify-between items-start gap-12 group overflow-hidden relative">
						<div className="relative z-10 space-y-6">
							<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
								<MdStar className="text-3xl" />
							</div>
							<div className="space-y-4">
								<h2 className="text-4xl sm:text-5xl font-black leading-none text-fg-light dark:text-fg-dark tracking-tighter">
									{t('cv.cta_title')}
								</h2>
								<p className="text-gray-600 dark:text-gray-400 font-medium text-lg leading-relaxed max-w-md">
									{t('cv.cta_description')}
								</p>
							</div>
						</div>
						<Link 
							href="/cv" 
							className="relative z-10 inline-flex items-center justify-center w-full sm:w-auto gap-3 px-10 py-5 bg-fg-light text-bg-light dark:bg-fg-dark dark:text-bg-dark rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
						>
							{t('cv.view_now')} <MdArrowForward className="text-2xl" />
						</Link>
						<div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
					</div>

					<div className="bg-white dark:bg-gray-900 border-2 border-fg-light dark:border-gray-800 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.05)] rounded-[2.5rem] p-10 sm:p-16 flex flex-col justify-between items-start gap-12">
						<div className="space-y-6">
							<div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
								<FaRss className="text-3xl" />
							</div>
							<div className="space-y-4">
								<h3 className="text-3xl font-black text-fg-light dark:text-fg-dark tracking-tight">Stay Updated</h3>
								<p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed max-w-sm">
									Follow my RSS feed to stay up to date with my latest posts and projects.
								</p>
							</div>
						</div>
						<a 
							href={`/${locale}/feed.xml`}
							className="inline-flex items-center justify-center w-full sm:w-auto gap-3 px-10 py-5 border-2 border-fg-light dark:border-gray-800 text-fg-light dark:text-fg-dark rounded-2xl font-black text-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
						>
							RSS Feed <MdArrowForward className="text-2xl" />
						</a>
					</div>
				</div>
			</section>
		</div>
	);
}

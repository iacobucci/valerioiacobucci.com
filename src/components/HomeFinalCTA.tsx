import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdStar } from 'react-icons/md';
import { FaRss } from 'react-icons/fa6';

export default async function HomeFinalCTA({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const t = await getTranslations();

	return (
		<section className="max-w-7xl mx-auto px-6 sm:px-12 pb-24 snap-section">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
				<div className="bg-white dark:bg-gray-900 border-2 border-fg-light dark:border-gray-800 rounded-[2.5rem] p-10 sm:p-16 flex flex-col justify-between items-start gap-12">
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

				<div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 sm:p-16 border-2 border-fg-light dark:border-gray-800 flex flex-col justify-between items-start gap-12 group overflow-hidden relative">
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
			</div>
		</section>
	);
}

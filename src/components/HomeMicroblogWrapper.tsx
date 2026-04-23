import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getMicroblogPosts } from '@/lib/microblog';
import HomeMicroblog from '@/components/HomeMicroblog';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdHistoryEdu } from 'react-icons/md';

export default async function HomeMicroblogWrapper({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const tMicro = await getTranslations('microblog');
	const microblogPosts = await getMicroblogPosts(3, 0);

	return (
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

				<HomeMicroblog initialPosts={microblogPosts} locale={locale} />

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
	);
}

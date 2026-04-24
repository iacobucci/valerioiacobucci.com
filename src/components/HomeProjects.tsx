import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProjectsWithGitHubData } from '@/lib/projects';
import ProjectCarousel from '@/components/ProjectCarousel';
import { Link } from '@/i18n/routing';
import { MdArrowForward, MdRocketLaunch } from 'react-icons/md';

export default async function HomeProjects({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const tProjects = await getTranslations('projects');
	const allProjectsData = await getProjectsWithGitHubData();
	const limitedProjects = allProjectsData.slice(0, 10);

	return (
		<section className="space-y-12 snap-section">
			<div className="max-w-7xl mx-auto px-6 sm:px-12 flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-6">
				<div className="space-y-2">
					<h2 className="text-3xl font-black text-fg-light dark:text-fg-dark flex items-center gap-3">
						<MdRocketLaunch className="text-orange-500" />
						{tProjects('title')}
					</h2>
					<p className="text-gray-500 dark:text-gray-400 font-medium">
						{tProjects('description')}
					</p>
				</div>
				<Link 
					href="/projects" 
					className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all"
				>
					{tProjects('view_all')} <MdArrowForward />
				</Link>
			</div>

			<ProjectCarousel projects={limitedProjects} />
		</section>
	);
}

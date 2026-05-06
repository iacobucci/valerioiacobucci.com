import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getProjectsWithGitHubData } from '@/lib/projects';
import ProjectList from '@/components/ProjectList';
import { Metadata } from 'next';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'projects' });

	return {
		title: t('title'),
		description: t('description'),
	};
}

export default async function ProjectsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('projects');

	const projectsWithData = await getProjectsWithGitHubData();

	return (
		<div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
			<main className="flex-1 w-full max-w-6xl mx-auto py-20 px-6">
				<header className="mb-16 text-center max-w-3xl mx-auto">
					<h1 className="text-4xl sm:text-5xl font-black text-fg-light dark:text-fg-dark mb-6 tracking-tight">
						{t('title')}
					</h1>
					<p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
						{t('description')}
					</p>
				</header>

				<ProjectList projects={projectsWithData} />

				<div className='mt-20 mb-10 text-center card-enter'>
					<a 
						href="https://www.buymeacoffee.com/iacobucci" 
						target="_blank" 
						rel="noopener noreferrer"
						className="inline-block transition-transform hover:scale-105 active:scale-95"
					>
						<img 
							src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=iacobucci&button_colour=FFDD00&font_colour=000000&font_family=Lato&outline_colour=000000&coffee_colour=ffffff" 
							alt="Buy me a coffee"
							width="200"
							height="50"
							className="mx-auto"
						/>
					</a>
				</div>
			</main>
		</div>
	);
}

import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeRoadmapBackground from './HomeRoadmapBackground';

export default async function HomeRoadmap({ locale }: { locale: string }) {
	setRequestLocale(locale);
	const t = await getTranslations();

	return (
		<section className="w-full snap-section relative overflow-visible pb-[132px]">
			<HomeRoadmapBackground />
			<div className="max-w-7xl mx-auto px-6 sm:px-12 relative z-10">
				<div className="flex flex-col items-center gap-12 w-full md:w-[80%] lg:w-[66%] mx-auto">
					<div className="text-center space-y-4">
						<h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
							{t("home.roadmap_title")}
						</h2>
						<p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
							{t("home.roadmap_description")}
						</p>
					</div>
					<div className="w-full py-4">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img 
							src={`/todo.svg`} 
							alt="Project Roadmap" 
							className="w-full h-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 bg-white/5"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

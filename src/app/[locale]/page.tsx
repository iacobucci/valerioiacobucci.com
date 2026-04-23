import { setRequestLocale, getTranslations } from 'next-intl/server';
import { HomeClient } from '@/components/HomeClient';
import HomeFavoritePosts from '@/components/HomeFavoritePosts';
import HomeProjects from '@/components/HomeProjects';
import HomeMicroblogWrapper from '@/components/HomeMicroblogWrapper';
import HomeFinalCTA from '@/components/HomeFinalCTA';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function FavoritePostsSkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
			<div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{[1, 2, 3].map(i => (
					<div key={i} className="h-96 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
				))}
			</div>
		</div>
	);
}

function ProjectsSkeleton() {
	return (
		<div className="space-y-12">
			<div className="max-w-7xl mx-auto px-6 sm:px-12 h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
			<div className="flex gap-8 overflow-hidden px-6 sm:px-12">
				{[1, 2, 3, 4].map(i => (
					<div key={i} className="w-[300px] sm:w-[450px] h-64 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] shrink-0 animate-pulse" />
				))}
			</div>
		</div>
	);
}

function MicroblogSkeleton() {
	return (
		<div className="bg-gray-50 dark:bg-gray-900/50 py-24">
			<div className="max-w-4xl mx-auto px-6 sm:px-12 space-y-12">
				<div className="flex flex-col items-center gap-4">
					<div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
					<div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
				</div>
				<div className="space-y-8">
					{[1, 2, 3].map(i => (
						<div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-[2rem] animate-pulse" />
					))}
				</div>
			</div>
		</div>
	);
}

function FinalCTASkeleton() {
	return (
		<div className="max-w-7xl mx-auto px-6 sm:px-12 pb-24">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
				<div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
			</div>
		</div>
	);
}

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	
	const t = await getTranslations();
	const tProjects = await getTranslations('projects');

	const homeTranslations = {
		intro: t("home.intro"),
		connect: t("home.connect"),
		read_blog: t("home.read_blog"),
	};

	return (
		<div className="flex flex-col flex-1 bg-bg-light font-sans dark:bg-bg-dark overflow-x-hidden snap-y snap-proximity">
			<section className="snap-section">
				<HomeClient 
					t={homeTranslations} 
					projectsTitle={tProjects('title')} 
					locale={locale} 
				/>
			</section>

			<div id="main-content" className="w-full py-24 space-y-32">
				<Suspense fallback={<FavoritePostsSkeleton />}>
					<HomeFavoritePosts locale={locale} />
				</Suspense>

				<Suspense fallback={<ProjectsSkeleton />}>
					<HomeProjects locale={locale} />
				</Suspense>

				<Suspense fallback={<MicroblogSkeleton />}>
					<HomeMicroblogWrapper locale={locale} />
				</Suspense>

				<Suspense fallback={<FinalCTASkeleton />}>
					<HomeFinalCTA locale={locale} />
				</Suspense>
			</div>
		</div>
	);
}

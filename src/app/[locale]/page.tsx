import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Terminal } from '@/components/Terminal';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('home');

	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-bg-light font-sans dark:bg-bg-dark">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-20 px-6 sm:px-16 bg-bg-light dark:bg-bg-dark sm:items-start">
				<div className="w-full mb-12">
					<h1 className="text-4xl font-bold text-fg-light dark:text-fg-dark mb-4">
						{t("intro")}
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
						{t("connect")}
					</p>
				</div>
				
				<div className="w-full">
					<Terminal />
				</div>
			</main>
		</div>
	);
}

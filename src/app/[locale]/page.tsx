import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations('home');

	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-gray-50 font-sans dark:bg-bg-dark">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-bg-light dark:bg-bg-dark sm:items-start">
				{t("intro")}
			</main>
		</div>
	);
}

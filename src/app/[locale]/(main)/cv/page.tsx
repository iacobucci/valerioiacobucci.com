import { setRequestLocale } from 'next-intl/server';
import CVClient from '@/components/CVClient';
import { getCV } from '@/lib/cv';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const cvData = getCV(locale);

  return {
    title: cvData.title,
    description: `${cvData.title} - Valerio Iacobucci`,
  };
}

export default async function CVPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cvData = getCV(locale);

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-6xl mx-auto py-20 px-6">
        <CVClient data={cvData} />
      </main>
    </div>
  );
}

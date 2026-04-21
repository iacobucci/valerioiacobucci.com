import { setRequestLocale, getTranslations } from 'next-intl/server';
import { projects, getGitHubData, ProjectGitHubData } from '@/lib/projects';
import ProjectList from '@/components/ProjectList';

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');

  const projectsWithData = await Promise.all(
    projects.map(async (project) => {
      const githubData = await getGitHubData(project.github_repo);
      return {
        ...project,
        stars: githubData.stars || 0,
        forks: githubData.forks || 0,
        github_url: githubData.github_url || `https://github.com/${project.github_repo}`,
        language: githubData.language,
        last_commit: githubData.last_commit || '',
        commits: 0, // GitHub API doesn't provide commit count easily in one call
      } as ProjectGitHubData;
    })
  );

  return (
    <div className="flex flex-col flex-1 bg-bg-light dark:bg-bg-dark font-sans">
      <main className="flex-1 w-full max-w-6xl mx-auto py-20 px-6">
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-fg-light dark:text-fg-dark mb-6 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('description')}
          </p>
        </header>

        <ProjectList projects={projectsWithData} />
      </main>
    </div>
  );
}

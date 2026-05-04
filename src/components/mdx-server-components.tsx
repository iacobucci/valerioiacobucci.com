import React from 'react';
import { getProjects, getGitHubData, ProjectGitHubData } from '@/lib/projects';
import { getMicroblogPost } from '@/lib/microblog';
import { getPost } from '@/lib/content';
import ProjectCard from './ProjectCard';
import MicroblogPostCard from './MicroblogPostCard';
import BlogPostCard from './BlogPostCard';
import { mdxComponents as coreMdxComponents } from './mdx-components';

export const serverMdxComponents = {
  ...coreMdxComponents,

  ProjectCard: async ({ id }: { id: string }) => {
    const projects = getProjects();
    const project = projects.find(p => p.github_repo === id);
    if (!project) return null;

    const githubData = await getGitHubData(project.github_repo);
    const fullProject = {
      ...project,
      ...githubData,
      description: githubData.description ?? '',
      stars: githubData.stars ?? 0,
      forks: githubData.forks ?? 0,
      commits: githubData.commits ?? 0,
      last_commit: githubData.last_commit ?? '',
      github_url: githubData.github_url ?? `https://github.com/${project.github_repo}`
    } as ProjectGitHubData;

    return (
      <div className="my-8 max-w-xl mx-auto">
        <ProjectCard project={fullProject} />
      </div>
    );
  },

  MicroblogPostCard: async ({ id, locale = 'en' }: { id: number | string, locale?: string }) => {
    const dbId = Number(id) + 1;
    const post = await getMicroblogPost(dbId);
    if (!post) return null;
    return (
      <div className="my-8 max-w-xl mx-auto">
        <MicroblogPostCard post={post} locale={locale} />
      </div>
    );
  },

  BlogPostCard: async ({ id, lang }: { id: string, lang: string }) => {
    const post = await getPost('blog', lang, id);
    if (!post) return null;
    return (
      <div className="my-8 max-w-xl mx-auto">
        <BlogPostCard post={post} locale={lang} />
      </div>
    );
  },
};

'use server';

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import { getProjects, getGitHubData, ProjectGitHubData } from '@/lib/projects';
import { getMicroblogPost } from '@/lib/microblog';
import { getPost } from '@/lib/content';

export async function serializeMdxAction(content: string) {
  try {
    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    });
    return { success: true, source: mdxSource };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMDXProjectCardDataAction(id: string) {
  const projects = getProjects();
  const project = projects.find(p => p.github_repo === id);
  if (!project) return null;

  const githubData = await getGitHubData(project.github_repo);
  return {
    ...project,
    ...githubData,
    description: githubData.description ?? '',
    stars: githubData.stars ?? 0,
    forks: githubData.forks ?? 0,
    commits: githubData.commits ?? 0,
    last_commit: githubData.last_commit ?? '',
    github_url: githubData.github_url ?? `https://github.com/${project.github_repo}`
  } as ProjectGitHubData;
}

export async function getMDXMicroblogPostDataAction(id: number) {
  return await getMicroblogPost(id);
}

export async function getMDXBlogPostCardDataAction(id: string, lang: string) {
  return await getPost('blog', lang, id);
}

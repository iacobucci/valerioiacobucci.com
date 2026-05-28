import React from 'react';
import { getProjectByRepo } from '@/lib/projects';
import { getMicroblogPost } from '@/lib/microblog';
import { getPost } from '@/lib/content';
import ProjectCard from './ProjectCard';
import MicroblogPostCard from './MicroblogPostCard';
import BlogPostCard from './BlogPostCard';
import { mdxComponents as coreMdxComponents } from './mdx-components';
import ImageSlideshow from './mdx/ImageSlideshow';

export const serverMdxComponents = {
  ...coreMdxComponents,

  ProjectCard: async ({ id }: { id: string }) => {
    const fullProject = await getProjectByRepo(id);
    if (!fullProject) return null;

    return (
      <div className="my-8 max-w-xl mx-auto">
        <ProjectCard project={fullProject} />
      </div>
    );
  },

  MicroblogPostCard: async ({ id, locale = 'en' }: { id: number | string, locale?: string }) => {
    const numericId = typeof id === 'number' ? id : parseInt(String(id), 10);
    const dbId = numericId + 1;
    
    if (isNaN(dbId)) return null;

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

  ImageSlideshow: (props: any) => <ImageSlideshow {...props} />,
};

'use server';

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import { rehypeMermaid } from '../mdx';
import { getProjectByRepo } from '@/lib/projects';
import { getMicroblogPost } from '@/lib/microblog';
import { getPost } from '@/lib/content';

export async function serializeMdxAction(content: string) {
  try {
    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeMermaid,
          [
            rehypePrettyCode,
            {
              theme: {
                dark: 'github-dark',
                light: 'github-light',
              },
              keepBackground: true,
            },
          ],
        ],
      },
    });
    return { success: true, source: mdxSource };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getMDXProjectCardDataAction(id: string) {
  return await getProjectByRepo(id);
}

export async function getMDXMicroblogPostDataAction(id: number) {
  return await getMicroblogPost(id);
}

export async function getMDXBlogPostCardDataAction(id: string, lang: string) {
  return await getPost('blog', lang, id);
}

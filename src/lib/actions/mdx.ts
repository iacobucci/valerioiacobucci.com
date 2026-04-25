'use server';

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';

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

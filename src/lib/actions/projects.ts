'use server';

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';

export async function getProjectReadmeAction(repo: string) {
  try {
    // 1. Fetch README metadata to get the download URL
    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch README metadata for ${repo}`);
    }

    const data = await res.json();
    const downloadUrl = data.download_url;

    // 2. Fetch the raw content
    const contentRes = await fetch(downloadUrl);
    if (!contentRes.ok) {
      throw new Error(`Failed to fetch raw README for ${repo}`);
    }

    const rawMarkdown = await contentRes.text();

    // 3. Serialize to MDX
    const mdxSource = await serialize(rawMarkdown, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        format: 'mdx',
      },
    });

    return { success: true, mdxSource };
  } catch (error: any) {
    console.error('Error in getProjectReadmeAction:', error);
    return { success: false, error: error.message };
  }
}

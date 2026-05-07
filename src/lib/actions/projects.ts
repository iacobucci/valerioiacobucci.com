'use server';

import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import { rehypeMermaid } from '../mdx';

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

    // 3. Pre-process to resolve relative paths in both Markdown and HTML syntax
    // We assume 'master' branch as requested
    let processedMarkdown = rawMarkdown;

    // Fix Markdown images: ![alt](path)
    processedMarkdown = processedMarkdown.replace(
      /!\[([^\]]*)\]\((?!https?:\/\/|\/)([^)]+)\)/g,
      (match, alt, path) => {
        const cleanPath = path.startsWith('./') ? path.slice(2) : path;
        return `![${alt}](https://raw.githubusercontent.com/${repo}/master/${cleanPath})`;
      }
    );

    // Fix Markdown links: [text](path)
    processedMarkdown = processedMarkdown.replace(
      /\[([^\]]*)\]\((?!https?:\/\/|\/|#)([^)]+)\)/g,
      (match, text, path) => {
        const cleanPath = path.startsWith('./') ? path.slice(2) : path;
        return `[${text}](https://github.com/${repo}/blob/master/${cleanPath})`;
      }
    );

    // Fix HTML images: <img ... src="./path" ... >
    processedMarkdown = processedMarkdown.replace(
      /<img([^>]+)src=["'](?!https?:\/\/|\/)([^"']+)["']([^>]*)>/gi,
      (match, before, src, after) => {
        const cleanPath = src.startsWith('./') ? src.slice(2) : src;
        const absoluteSrc = `https://raw.githubusercontent.com/${repo}/master/${cleanPath}`;
        return `<img${before}src="${absoluteSrc}"${after}>`;
      }
    );

    // Fix HTML links: <a ... href="./path" ... >
    processedMarkdown = processedMarkdown.replace(
      /<a([^>]+)href=["'](?!https?:\/\/|\/|#)([^"']+)["']([^>]*)>/gi,
      (match, before, href, after) => {
        const cleanPath = href.startsWith('./') ? href.slice(2) : href;
        const absoluteHref = `https://github.com/${repo}/blob/master/${cleanPath}`;
        return `<a${before}href="${absoluteHref}"${after}>`;
      }
    );

    // 4. Serialize to MDX
    const mdxSource = await serialize(processedMarkdown, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeMermaid,
          [
            rehypePrettyCode,
            {
              theme: 'tokyo-night',
              keepBackground: false,
            },
          ],
        ],
        format: 'mdx',
      },
    });

    return { success: true, mdxSource };
  } catch (error: any) {
    console.error('Error in getProjectReadmeAction:', error);
    return { success: false, error: error.message };
  }
}

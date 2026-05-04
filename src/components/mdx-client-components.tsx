'use client';

import React from 'react';
import { mdxComponents as coreMdxComponents } from './mdx-components';
import { MDXProjectCardPreview, MDXMicroblogPostCardPreview, MDXBlogPostCardPreview } from './MDXCardPreviews';

export const clientMdxComponents = {
  ...coreMdxComponents,
  ProjectCard: (props: { id: string }) => <MDXProjectCardPreview {...props} />,
  MicroblogPostCard: (props: { id: number | string, locale?: string }) => <MDXMicroblogPostCardPreview {...props} />,
  BlogPostCard: (props: { id: string, lang: string }) => <MDXBlogPostCardPreview {...props} />,
};

'use client';

import React from 'react';
import { mdxComponents as coreMdxComponents } from './mdx-components';
import { MDXProjectCardPreview, MDXMicroblogPostCardPreview, MDXBlogPostCardPreview } from './MDXCardPreviews';
import ImageSlideshow from './mdx/ImageSlideshow';

export const clientMdxComponents = {
  ...coreMdxComponents,
  ProjectCard: (props: { id: string }) => <MDXProjectCardPreview {...props} />,
  MicroblogPostCard: (props: { id: number | string, locale?: string }) => <MDXMicroblogPostCardPreview {...props} />,
  BlogPostCard: (props: { id: string, lang: string }) => <MDXBlogPostCardPreview {...props} />,
  ImageSlideshow: (props: any) => <ImageSlideshow {...props} />,
};

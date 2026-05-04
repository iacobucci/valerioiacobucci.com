'use client';

import React, { useEffect, useState } from 'react';
import { getMDXProjectCardDataAction, getMDXMicroblogPostDataAction, getMDXBlogPostCardDataAction } from '@/lib/actions/mdx';
import ProjectCard from './ProjectCard';
import MicroblogPostCard from './MicroblogPostCard';
import BlogPostCard from './BlogPostCard';
import type { ProjectGitHubData } from '@/lib/projects';
import type { MicroblogPostSerializable } from '@/lib/db';
import type { ContentMetadata } from '@/lib/content';

const PreviewPlaceholder = ({ label, id, color }: { label: string, id: string | number, color: string }) => (
  <div className={`my-8 p-6 rounded-2xl border border-dashed ${color} bg-opacity-10 text-center animate-in fade-in duration-300`}>
    <div className="flex items-center justify-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full animate-pulse bg-current" />
      <p className="font-bold">{label}: {id}</p>
    </div>
    <p className="text-sm opacity-60">Loading preview...</p>
  </div>
);

export function MDXProjectCardPreview({ id }: { id: string }) {
  const [data, setData] = useState<ProjectGitHubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMDXProjectCardDataAction(id).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PreviewPlaceholder label="Project Card" id={id} color="border-blue-300 dark:border-blue-700 text-blue-600" />;
  if (!data) return <p className="text-red-500">Project not found: {id}</p>;

  return (
    <div className="my-8 max-w-xl mx-auto text-left">
      <ProjectCard project={data} />
    </div>
  );
}

export function MDXMicroblogPostCardPreview({ id, locale = 'en' }: { id: number | string, locale?: string }) {
  const [data, setData] = useState<MicroblogPostSerializable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Offset by +1 as requested
    const dbId = Number(id) + 1;
    getMDXMicroblogPostDataAction(dbId).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PreviewPlaceholder label="Microblog Post" id={id} color="border-purple-300 dark:border-purple-700 text-purple-600" />;
  if (!data) return <p className="text-red-500">Microblog post not found: {id}</p>;

  return (
    <div className="my-8 max-w-xl mx-auto text-left">
      <MicroblogPostCard post={data} locale={locale} />
    </div>
  );
}

export function MDXBlogPostCardPreview({ id, lang }: { id: string, lang: string }) {
  const [data, setData] = useState<ContentMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMDXBlogPostCardDataAction(id, lang).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [id, lang]);

  if (loading) return <PreviewPlaceholder label="Blog Post" id={id} color="border-amber-300 dark:border-amber-700 text-amber-600" />;
  if (!data) return <p className="text-red-500">Blog post not found: {id}</p>;

  return (
    <div className="my-8 max-w-xl mx-auto text-left">
      <BlogPostCard post={data} locale={lang} />
    </div>
  );
}

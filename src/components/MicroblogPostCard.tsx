import React from 'react';
import { MicroblogPost } from '@/lib/db';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';

import Linkify from 'linkify-react';

interface MicroblogPostCardProps {
  post: MicroblogPost;
  locale: string;
}

const linkifyOptions = {
  className: 'text-blue-600 dark:text-blue-400 hover:underline',
  target: '_blank',
  rel: 'noopener noreferrer'
};

export default function MicroblogPostCard({ post, locale }: MicroblogPostCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow text-left">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
          <div className="font-mono opacity-50">#{post.id}</div>
          <FormattedDate date={post.created_at} locale={locale} />
        </div>
        
        <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
          <Linkify options={linkifyOptions}>
            {post.content}
          </Linkify>
        </div>
        
        {post.image_url && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mt-2">
            <Image
              src={post.image_url}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

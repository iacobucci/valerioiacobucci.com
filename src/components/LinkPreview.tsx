'use client';

import React, { useEffect, useState } from 'react';
import { getLinkPreviewAction, LinkPreviewData } from '@/lib/actions/link-preview';

interface LinkPreviewProps {
  url: string;
}

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    getLinkPreviewAction(url).then((data) => {
      if (isMounted && data) {
        setPreview(data);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description)) {
    return null;
  }

  // Get hostname for a cleaner display
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex flex-col sm:flex-row gap-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors group/preview"
    >
      {preview.image && (
        <div className="relative w-full sm:w-32 h-32 sm:h-auto overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-4 flex flex-col justify-center min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-1">
          {preview.siteName || domain}
        </div>
        {preview.title && (
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1 mb-1 group-hover/preview:text-blue-600 dark:group-hover/preview:text-blue-400 transition-colors">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

import React from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export const mdxComponents = {
  h1: (props: any) => (
    <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-xl font-medium mt-6 mb-2 text-gray-900 dark:text-white" {...props} />
  ),
  p: (props: any) => (
    <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />
  ),
  ul: (props: any) => (
    <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal list-inside mt-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
  ),
  li: (props: any) => (
    <li className="ml-4" {...props} />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic my-6 text-gray-600 dark:text-gray-400" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 font-mono text-sm" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto my-6 text-sm" {...props} />
  ),
  a: ({ href, ...props }: any) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
      );
    }
    if (href?.startsWith('#')) {
      return <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      />
    );
  },
  img: ({ src, alt, ...props }: any) => {
     // Default image component, we might want to override this in the page to handle relative paths
     return (
       // eslint-disable-next-line @next/next/no-img-element
       <img 
         src={src} 
         alt={alt} 
         className="rounded-lg my-8 w-full" 
         {...props} 
       />
     );
  },
  table: (props: any) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
  ),
  th: (props: any) => (
    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-bold" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2" {...props} />
  ),
  tr: (props: any) => (
    <tr className="even:bg-gray-50 dark:even:bg-gray-900/50" {...props} />
  ),
};

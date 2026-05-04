import React from 'react';
import { Link } from '@/i18n/routing';
import Mermaid from './mdx/Mermaid';

type MDXProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

export const mdxComponents = {
  h1: (props: MDXProps) => (
    <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white" {...props} />
  ),
  h2: (props: MDXProps) => (
    <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white" {...props} />
  ),
  h3: (props: MDXProps) => (
    <h3 className="text-xl font-medium mt-6 mb-2 text-gray-900 dark:text-white" {...props} />
  ),
  p: (props: MDXProps) => (
    <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />
  ),
  ul: (props: MDXProps) => (
    <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
  ),
  ol: (props: MDXProps) => (
    <ol className="list-decimal list-inside mt-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
  ),
  li: (props: MDXProps) => (
    <li className="ml-4" {...props} />
  ),
  blockquote: (props: MDXProps) => (
    <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic my-6 text-gray-600 dark:text-gray-400" {...props} />
  ),
  code: (props: MDXProps) => {
    if (props.className === 'language-mermaid') {
      return <Mermaid chart={props.children?.toString() || ''} />;
    }
    return <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 font-mono text-sm" {...props} />;
  },
  pre: (props: MDXProps) => {
    const isMermaid = React.isValidElement(props.children) && 
                      (props.children.props as { className?: string })?.className === 'language-mermaid';
    
    if (isMermaid) {
      return <>{props.children}</>;
    }
    return <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto my-6 text-sm" {...props} />;
  },
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith('/')) {
      const { ...otherProps } = props;
      return (
        <Link 
          href={href as string} 
          className="text-blue-600 dark:text-blue-400 hover:underline" 
          {...(otherProps as any)} 
        />
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
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
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
  table: (props: MDXProps) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: MDXProps) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props} />
  ),
  th: (props: MDXProps) => (
    <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-bold" {...props} />
  ),
  td: (props: MDXProps) => (
    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2" {...props} />
  ),
  tr: (props: MDXProps) => (
    <tr className="even:bg-gray-50 dark:even:bg-gray-900/50" {...props} />
  ),
};

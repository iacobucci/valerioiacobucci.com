import React from 'react';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

interface ContentRendererProps {
  Content: any;
  contentType: string;
  slug: string;
}

export default function ContentRenderer({ Content, contentType, slug }: ContentRendererProps) {
  const components = {
    ModelViewer: (props: { url: string; [key: string]: unknown }) => {
      let url = props.url;
      if (url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
        const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
        url = `/assets/${contentType}/${slug}/${normalizedUrl}`;
      }
      return <ModelViewerWrapper {...props} url={url} />;
    },
    img: ({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      let finalSrc = src;
      if (src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
        finalSrc = `/assets/${contentType}/${slug}/${normalizedSrc}`;
      }
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
      return <img {...props} src={finalSrc} />;
    }
  };

  return <Content components={components} />;
}

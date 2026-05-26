'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlideshowProps {
  children: React.ReactNode;
}

export default function ImageSlideshow({ children }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showControls, setShowControls] = React.useState(true);
  const [captionVisible, setCaptionVisible] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>(null);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout>(null);

  const resetHideTimeout = React.useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
  }, []);
// Flatten children to handle images wrapped in <p> tags by MDX
const flattenChildren = (children: React.ReactNode): React.ReactNode[] => {
  return React.Children.toArray(children).reduce((acc: React.ReactNode[], child) => {
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<any>;
      // If it's a paragraph, it might contain the images
      if (element.type === 'p' || element.props?.mdxType === 'p') {
        return [...acc, ...flattenChildren(element.props.children)];
      }
      // Skip empty text or line breaks
      if (typeof element.type === 'string' && (element.type === 'br' || (element.type === 'span' && !element.props.className?.includes('mdx-img')))) {
        if (element.props.children) return [...acc, ...flattenChildren(element.props.children)];
        return acc;
      }
      return [...acc, element];
    }
    return acc;
  }, []);
};
  const childrenArray = React.useMemo(() => {
    return flattenChildren(children).filter(child => {
      if (React.isValidElement(child)) {
        const isImg = child.type === 'img' || (child.props as any)?.mdxType === 'img';
        const isMdxImg = (child.props as any)?.className?.includes('mdx-img');
        return isImg || isMdxImg;
      }
      return false;
    });
  }, [children]);

  const getAltText = (element: any): string | undefined => {
    if (!element) return undefined;
    if (element.props?.alt) return element.props.alt;
    if (element.props?.children) {
      if (Array.isArray(element.props.children)) {
        for (const child of element.props.children) {
          const alt = getAltText(child);
          if (alt) return alt;
        }
      } else {
        return getAltText(element.props.children);
      }
    }
    return undefined;
  };

  const currentCaption = childrenArray[currentIndex] ? getAltText(childrenArray[currentIndex]) : '';

  const goTo = (idx: number) => {
    resetHideTimeout();
    if (idx === currentIndex) return;
    
    setCaptionVisible(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setCaptionVisible(true);
      containerRef.current?.scrollTo({ 
        left: containerRef.current.clientWidth * idx, 
        behavior: 'smooth' 
      });
    }, 150);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex + 1) % childrenArray.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((currentIndex - 1 + childrenArray.length) % childrenArray.length);
  };

  const handleScroll = () => {
    resetHideTimeout();
    
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const index = Math.round(containerRef.current.scrollLeft / containerRef.current.clientWidth);
        if (index !== currentIndex) {
          setCaptionVisible(false);
          setTimeout(() => {
            setCurrentIndex(index);
            setCaptionVisible(true);
          }, 150);
        }
      }
    }, 50);
  };

  React.useEffect(() => {
    resetHideTimeout();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [resetHideTimeout]);

  if (childrenArray.length === 0) {
    return (
      <div className="my-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
        <p className="font-bold">Slideshow: No content found</p>
        <p className="text-sm">Please provide images as children of the component.</p>
      </div>
    );
  }

  return (
    <div 
      className="my-8 group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl"
      onMouseMove={resetHideTimeout}
      onTouchStart={resetHideTimeout}
    >
      <div className="relative">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="relative flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {childrenArray.map((child, idx) => (
            <div key={idx} className="w-full flex-shrink-0 snap-center flex items-center justify-center bg-black/[0.02] dark:bg-black/20 aspect-video overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center [&_img]:my-0! [&_img]:rounded-none! [&_img]:max-h-full [&_img]:w-auto! [&_img]:object-contain [&_span.mdx-img]:my-0! [&_span.mdx-img]:rounded-none! [&_span.mdx-img]:w-auto! [&_span.mdx-img]:h-full [&_object]:h-full">
                {child}
              </div>
            </div>
          ))}
        </div>

        {childrenArray.length > 1 && (
          <>
            <button
              onClick={prev}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-700 active:scale-95 z-30 flex items-center justify-center border border-gray-200 dark:border-gray-700 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-700 active:scale-95 z-30 flex items-center justify-center border border-gray-200 dark:border-gray-700 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/40 z-30 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {childrenArray.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 min-h-[64px] flex items-center justify-center px-6 py-4">
        <p
          className={`text-sm font-medium text-gray-700 dark:text-gray-300 text-center italic transition-all duration-300 transform ${captionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          {currentCaption || ' '}
        </p>
      </div>
    </div>
  );
}

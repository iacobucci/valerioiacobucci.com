'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageItem {
  src: string;
  alt?: string;
  caption?: string;
}

interface ImageSlideshowProps {
  images: ImageItem[];
  assetPath?: string;
  version?: string | number;
}

export default function ImageSlideshow({ images, assetPath, version }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  // Safety check to ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];

  const next = () => setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);

  const getFullSrc = (src: string) => {
    if (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:')) {
      return src;
    }
    const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
    let fullUrl = assetPath ? `${assetPath}/${normalizedSrc}` : normalizedSrc;
    if (version) {
      fullUrl += `?v=${version}`;
    }
    return fullUrl;
  };

  if (safeImages.length === 0) return null;

  return (
    <div className="my-8 group relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
      <div className="relative aspect-video flex items-center justify-center overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${safeImages.length * 100}%` }}
        >
          {safeImages.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center bg-black/5">
              <img
                src={getFullSrc(img.src)}
                alt={img.alt || img.caption || `Slide ${idx + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {safeImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-700 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md">
          {safeImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {safeImages[currentIndex]?.caption && (
        <div className="px-6 py-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center italic">
            {safeImages[currentIndex].caption}
          </p>
        </div>
      )}
    </div>
  );
}

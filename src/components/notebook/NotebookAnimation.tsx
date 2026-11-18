'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationData } from './types';
import { Play, Pause, RotateCcw, SkipForward, SkipBack } from 'lucide-react';

interface NotebookAnimationProps {
  data: AnimationData;
  className?: string;
}

export const NotebookAnimation: React.FC<NotebookAnimationProps> = ({ data, className = '' }) => {
  const frames = data.frames || [];
  const fps = Math.max(1, Math.min(120, data.fps || 30));
  const intervalMs = 1000 / fps;
  const loop = data.loop !== false;
  const width = data.width || 600;
  const height = data.height || 300;

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(data.autoPlay ?? false);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const totalFrames = frames.length;

  const stepNext = useCallback(() => {
    setCurrentFrame((prev) => {
      if (prev + 1 >= totalFrames) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [totalFrames, loop]);

  const stepPrev = useCallback(() => {
    setCurrentFrame((prev) => {
      if (prev - 1 < 0) {
        return loop ? totalFrames - 1 : 0;
      }
      return prev - 1;
    });
  }, [totalFrames, loop]);

  // Animation RAF loop
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const delta = now - lastTimeRef.current;

      if (delta >= intervalMs) {
        lastTimeRef.current = now - (delta % intervalMs);
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next >= totalFrames) {
            if (!loop) {
              setIsPlaying(false);
              return prev;
            }
            return 0;
          }
          return next;
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, intervalMs, totalFrames, loop]);

  const currentFrameContent = frames[currentFrame] || frames[0] || '';
  const isSvgString = currentFrameContent.trim().startsWith('<svg');
  const isDataUrl = currentFrameContent.startsWith('data:image');

  return (
    <div className={`w-full flex flex-col items-center select-none ${className}`}>
      {data.title && (
        <div className="w-full text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 font-mono">
          {data.title}
        </div>
      )}

      {/* Frame Visual Container (Aspect ratio preserved to prevent layout shift) */}
      <div
        className="w-full max-w-full relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-center"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {isSvgString ? (
          <div
            className="w-full h-full [&>svg]:w-full [&>svg]:h-full font-sans"
            dangerouslySetInnerHTML={{ __html: currentFrameContent }}
          />
        ) : isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentFrameContent}
            alt={data.title || `Frame ${currentFrame + 1}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="p-4 text-xs font-mono text-gray-500 whitespace-pre-wrap">
            {currentFrameContent}
          </div>
        )}
      </div>

      {/* Animation Controls Bar */}
      {totalFrames > 1 && (
        <div className="w-full flex flex-wrap items-center justify-between gap-3 px-3 py-2 mt-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={stepPrev}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Previous frame"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={stepNext}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Next frame"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentFrame(0)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Reset to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 flex items-center gap-2 min-w-[120px] max-w-md">
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={currentFrame}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrame(Number(e.target.value));
              }}
              className="w-full accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Frame Counter / FPS Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span>
              {currentFrame + 1}/{totalFrames}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">({fps} FPS)</span>
          </div>
        </div>
      )}
    </div>
  );
};

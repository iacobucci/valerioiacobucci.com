'use client';

import React from 'react';
import { useAudio } from './AudioContext';
import { Play, Pause, X, Music, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function GlobalAudioPlayer() {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek, close } = useAudio();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek((val / 100) * duration);
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        aria-label="Audio player"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
            <Music className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
              {currentTrack.title}
            </p>
            {currentTrack.artist && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {currentTrack.artist}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-mono text-gray-400">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress || 0}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
              />
              <span className="text-[10px] font-mono text-gray-400">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

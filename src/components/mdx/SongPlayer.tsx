'use client';

import React from 'react';
import { useAudio } from '../audio/AudioContext';
import { Play, Pause, Disc } from 'lucide-react';

interface SongPlayerProps {
  title?: string;
  src: string;
  artist?: string;
  cover?: string;
  assetPath?: string;
}

export default function SongPlayer({ title, src, artist, cover, assetPath }: SongPlayerProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();

  // Resolve relative src if needed
  let finalSrc = src;
  if (assetPath && src && !src.startsWith('http') && !src.startsWith('/')) {
    const normalized = src.startsWith('./') ? src.slice(2) : src;
    finalSrc = `${assetPath}/${normalized}`;
  }

  const trackTitle = title || src.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Soundtrack';

  const isThisTrack = currentTrack?.src === finalSrc;
  const isThisPlaying = isThisTrack && isPlaying;

  const handlePlayClick = () => {
    if (isThisTrack) {
      togglePlay();
    } else {
      playTrack({ title: trackTitle, src: finalSrc, artist, cover });
    }
  };

  return (
    <div className="my-6 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 flex items-center justify-between gap-4 not-prose">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          isThisPlaying 
            ? 'bg-blue-600 text-white animate-spin' 
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}>
          <Disc className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Music Track
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {trackTitle}
          </p>
          {artist && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {artist}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handlePlayClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
          isThisPlaying
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-blue-600 hover:text-white'
        }`}
      >
        {isThisPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 ml-0.5" />
            <span>Play Track</span>
          </>
        )}
      </button>
    </div>
  );
}

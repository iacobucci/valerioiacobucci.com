'use client';

import { SessionProvider } from "next-auth/react";
import ToastContainer from "./Toast";
import { DraftsProvider } from "./DraftsContext";
import { AudioProvider } from "./audio/AudioContext";
import GlobalAudioPlayer from "./audio/GlobalAudioPlayer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DraftsProvider>
        <AudioProvider>
          {children}
          <GlobalAudioPlayer />
          <ToastContainer />
        </AudioProvider>
      </DraftsProvider>
    </SessionProvider>
  );
}

'use client';

import { SessionProvider } from "next-auth/react";
import ToastContainer from "./Toast";
import { DraftsProvider } from "./DraftsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DraftsProvider>
        {children}
        <ToastContainer />
      </DraftsProvider>
    </SessionProvider>
  );
}

'use client';

import React, { createContext, useContext, useState } from 'react';
import { useSession } from 'next-auth/react';

interface DraftsContextType {
  showDrafts: boolean;
  setShowDrafts: (show: boolean) => void;
}

const DraftsContext = createContext<DraftsContextType | undefined>(undefined);

export function DraftsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [userOverride, setUserOverride] = useState<boolean | null>(null);

  const user = session?.user as { email?: string | null; username?: string } | undefined;
  const isAuthorized = 
    !!user?.email?.toLowerCase().trim() && (
      user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
      user?.username === "iacobucci"
    );

  const showDrafts = userOverride !== null ? userOverride : isAuthorized;

  const handleSetShowDrafts = (show: boolean) => {
    setUserOverride(show);
  };

  return (
    <DraftsContext.Provider value={{ showDrafts, setShowDrafts: handleSetShowDrafts }}>
      {children}
    </DraftsContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftsContext);
  if (context === undefined) {
    throw new Error('useDrafts must be used within a DraftsProvider');
  }
  return context;
}

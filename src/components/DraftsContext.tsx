'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DraftsContextType {
  showDrafts: boolean;
  setShowDrafts: (show: boolean) => void;
}

const DraftsContext = createContext<DraftsContextType | undefined>(undefined);

export function DraftsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [showDrafts, setShowDrafts] = useState(false);

  // Initialize showDrafts based on authorization when session loads
  useEffect(() => {
    if (session?.user) {
      const user = session.user as { email?: string | null; username?: string };
      const isAuthorized = 
        user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
        user?.username === "iacobucci";
      
      if (isAuthorized) {
        setShowDrafts(true);
      }
    } else {
      setShowDrafts(false);
    }
  }, [session]);

  return (
    <DraftsContext.Provider value={{ showDrafts, setShowDrafts }}>
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

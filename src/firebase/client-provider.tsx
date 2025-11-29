'use client';

import { useState, useEffect, ReactNode, useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebaseApp, setFirebaseApp] = useState<any>(null);

  useEffect(() => {
    const app = initializeFirebase();
    setFirebaseApp(app);
  }, []);

  const provider = useMemo(() => {
    if (!firebaseApp) {
      return null;
    }
    return (
      <FirebaseProvider
        firebaseApp={firebaseApp.app}
        auth={firebaseApp.auth}
        firestore={firebaseApp.firestore}
      >
        {children}
      </FirebaseProvider>
    );
  }, [firebaseApp, children]);

  if (!firebaseApp) {
    return null;
  }

  return provider;
}

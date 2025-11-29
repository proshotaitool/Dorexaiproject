'use client';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState, useMemo } from 'react';

import { useAuth, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<Auth['currentUser'] | null>(null);
  const [authIsLoading, setAuthIsLoading] = useState(true);

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(userDocRef as any);

  useEffect(() => {
    if (!auth) {
      setAuthIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, profile, isLoading: authIsLoading || (user && profileLoading) };
}

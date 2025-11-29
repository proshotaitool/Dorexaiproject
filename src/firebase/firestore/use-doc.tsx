'use client';
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useDoc<T>(ref: DocumentReference<T> | Query<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(ref as DocumentReference<T>, (snapshot) => {
      if (snapshot.exists()) {
        setData({ ...(snapshot.data() as T), id: snapshot.id });
      } else {
        setData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ref]);

  return { data, isLoading };
}

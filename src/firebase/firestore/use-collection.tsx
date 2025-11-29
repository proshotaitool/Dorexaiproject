'use client';
import {
  collection,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useFirestore } from '@/firebase/provider';

type UseCollectionOptions = {
  where?: [string, '==', any];
};

export function useCollection<T>(ref: CollectionReference<T> | Query<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      return;
    }
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      setData(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ref]);

  return { data, isLoading };
}

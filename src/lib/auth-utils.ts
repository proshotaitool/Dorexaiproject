
'use client';

import { collection, doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

const avatarStyles = [
  'border-primary',
  'border-green-500',
  'border-red-500',
  'border-yellow-400',
  'border-purple-500',
  'border-pink-500',
  'ring-4 ring-offset-2 ring-primary',
  'rounded-lg',
  'shadow-lg shadow-primary/30',
  'grayscale',
];

// assignUserRole removed as it caused permission issues. 
// Admin role is now assigned via the secure /verify-admin page.

export const createUserProfile = async (firestore: Firestore, user: FirebaseUser, extraData: object = {}) => {
  const userDocRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const role = 'user';
    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];

    await setDoc(userDocRef, {
      name: user.displayName || 'New User',
      email: user.email,
      avatarUrl: user.photoURL,
      plan: 'Free',
      status: 'Active',
      role,
      credits: 100,
      joined: serverTimestamp(),
      avatarStyle: randomStyle,
      ...extraData,
    });

    toast({ title: 'Welcome!', description: 'Welcome to DoreX Ai!' });
  }
};

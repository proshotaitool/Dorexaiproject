'use client';

import { useAuth, useFirestore, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { checkAdminSession } from '@/app/actions';

import { ToolProvider } from '@/components/providers/tool-provider';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile, isLoading: profileLoading } = useDoc(userDocRef as any) as any;

  // Check session and role
  useEffect(() => {
    const checkAccess = async () => {
      const hasSession = await checkAdminSession();

      // If we have a valid secure session, we allow access regardless of the firestore role lag
      if (hasSession) {
        return;
      }

      // If no session, and profile says not admin, redirect
      if (!profileLoading && userProfile && userProfile.role !== 'admin') {
        router.replace('/profile');
      }

      // If no session and no user (and auth finished loading), redirect to login
      if (!authLoading && !user) {
        router.replace('/login');
      }
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, userProfile, authLoading, profileLoading, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ToolProvider>
      {children}
    </ToolProvider>
  );
}

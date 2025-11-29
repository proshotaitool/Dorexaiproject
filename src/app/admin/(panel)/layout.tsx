
'use client';

import { AdminSidebar } from '@/components/layout/admin-sidebar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/admin');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-admin-background text-admin-foreground">
      <AdminSidebar />
      <div className="flex flex-col flex-1 ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-admin-card px-4 sm:px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Website
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}

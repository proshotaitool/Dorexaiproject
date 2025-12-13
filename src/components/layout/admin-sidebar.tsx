
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Globe,
  FileText,
  Search,
  CreditCard,
  Megaphone,
  Bell,
  Settings,
  FileBarChart,
  LogOut,
  User,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/website-editor', label: 'Website Editor', icon: Globe },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/seo', label: 'SEO', icon: Search },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileBarChart },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd clear the session/token here
    router.push('/');
  };

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 left-0 z-40 border-r bg-admin-card text-admin-foreground">
      <div className="flex items-center h-16 border-b px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          <Icons.logo className="h-7 w-7 text-primary" />
          <span>DoreX Ai Admin</span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 py-4 px-2">
          <ul className="grid items-start gap-1 text-sm font-medium">
            {adminNavLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-admin-muted-foreground transition-all hover:bg-admin-muted hover:text-admin-foreground',
                    pathname.startsWith(href) && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-2 space-y-2">
          <Separator />
          <Link
            href="/admin/profile"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-admin-muted-foreground transition-all hover:bg-admin-muted hover:text-admin-foreground',
              pathname.startsWith('/admin/profile') && 'bg-primary text-primary-foreground'
            )}
          >
            <User className="h-5 w-5" />
            My Profile
          </Link>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

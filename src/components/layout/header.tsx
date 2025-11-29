
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, User as UserIcon, LogOut, Globe, Bell, Shield, LayoutDashboard, Check, CreditCard, Infinity, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useUser, useAuth, useDoc, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useTranslation, languages } from '@/hooks/use-translation';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { UserProfile } from '@/types';

const notifications = [
  { id: 1, title: 'New feature unlocked!', description: 'You can now use the AI Background Remover.', time: '5m ago' },
  { id: 2, title: 'Your export is ready', description: 'Your compressed image has been downloaded.', time: '1h ago' },
  { id: 3, title: 'Weekly Recap', description: 'You processed 25 files this week. Keep it up!', time: '1d ago' },
];

const dummyUser: UserProfile = {
  uid: 'dummy-uid',
  name: 'Jane Doe (Preview)',
  email: 'jane.doe@example.com',
  credits: 150,
  avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2MjMzOTU2MHww&ixlib=rb-4.1.0&q=80&w=1080',
  avatarStyle: 'border-primary',
  plan: 'Pro',
  status: 'Active',
  joined: { toDate: () => new Date() },
  role: 'user',
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const { user: authUser, isLoading: authLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { isPreviewing } = usePreviewMode();

  const [hasUnread, setHasUnread] = useState(true);

  const userDocRef = authUser && !isPreviewing ? doc(firestore, 'users', authUser.uid) : null;
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = authLoading || (authUser && profileLoading && !isPreviewing);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/tools', label: t('nav.tools') },
    { href: '/premium', label: t('nav.premium') },
    { href: '/pricing', label: t('nav.pricing') },
    { href: '/about', label: t('nav.about') },
  ];

  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          'transition-colors hover:text-primary',
          pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground',
          isMobile ? 'text-lg py-2' : 'text-sm font-medium'
        )}
      >
        {link.label}
      </Link>
    ));

  const isAdmin = !isPreviewing && userProfile?.role === 'admin';
  const displayUser = isPreviewing ? dummyUser : userProfile;
  const displayAuthUser = isPreviewing ? { email: dummyUser.email } : authUser;

  const creditsUsedToday = displayUser?.credits !== undefined ? 100 - displayUser.credits : 0;


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center md:mr-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center space-x-2">
                <Logo />
              </Link>
              <div className="my-4 h-px w-full bg-border" />
              <div className="flex flex-col space-y-4">{renderNavLinks(true)}</div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">{renderNavLinks()}</nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            {!displayAuthUser && !authLoading && (
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-medium">
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                  <Link href="/signup">Sign Up Free</Link>
                </Button>
              </div>
            )}
            {displayAuthUser && (
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex rounded-full border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 hover:border-primary/40 transition-all group">
                      <span className="mr-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Credits:</span>
                      <span className="font-bold text-primary flex items-center">
                        <Infinity className="h-4 w-4" />
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" /> Credit Wallet
                        </h4>
                        <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">Pro Plan</Badge>
                      </div>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-4xl font-bold text-foreground"><Infinity className="h-8 w-8 inline-block translate-y-1" /></span>
                        <span className="text-sm text-muted-foreground">available credits</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Daily Limit</p>
                          <p className="font-semibold text-sm flex items-center gap-1">Unlimited <Check className="h-3 w-3 text-green-500" /></p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Resets In</p>
                          <p className="font-semibold text-sm">12h 30m</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Usage</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Zap className="h-3 w-3" /></div>
                              <span>Image Compressor</span>
                            </div>
                            <span className="text-muted-foreground text-xs">Just now</span>
                          </div>
                          <div className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500"><Zap className="h-3 w-3" /></div>
                              <span>AI Generator</span>
                            </div>
                            <span className="text-muted-foreground text-xs">2h ago</span>
                          </div>
                        </div>
                      </div>

                      <Link href="/pricing" className='block pt-2'>
                        <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity text-white shadow-lg h-10">
                          <CreditCard className="mr-2 h-4 w-4" /> Upgrade Plan
                        </Button>
                      </Link>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 transition-transform duration-300 hover:scale-110"><Globe className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[16.5rem] overflow-y-auto rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                    <DropdownMenuLabel>Language</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
                      {languages.map(lang => (
                        <DropdownMenuRadioItem key={lang.code} value={lang.code} className="flex justify-between cursor-pointer rounded-lg focus:bg-primary/10">
                          {lang.name}
                          {language === lang.code && <Check className="h-4 w-4 text-primary" />}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu onOpenChange={(open) => { if (open) setHasUnread(false) }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10 transition-transform duration-300 hover:scale-110">
                      <Bell className="h-5 w-5" />
                      {hasUnread && !isPreviewing && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                    <DropdownMenuLabel className="flex justify-between items-center p-4">
                      <span>Notifications</span>
                      <Badge variant="secondary" className="rounded-full px-2">New</Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <div className="max-h-80 overflow-y-auto p-1">
                      {notifications.map(notification => (
                        <DropdownMenuItem key={notification.id} className="flex-col items-start gap-1 p-3 rounded-lg focus:bg-primary/5 cursor-pointer mb-1">
                          <div className="flex justify-between w-full">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-[10px] text-muted-foreground">{notification.time}</p>
                          </div>
                          <p className="text-xs text-muted-foreground w-full line-clamp-2">{notification.description}</p>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="p-2 focus:bg-transparent">
                      <Button variant="ghost" size="sm" className="w-full text-xs h-8 rounded-lg">Mark all as read</Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-px bg-white/10 mx-1"></div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 p-0 overflow-hidden border-2 border-transparent hover:border-primary/50">
                      <Avatar className={cn("h-full w-full", displayUser?.avatarStyle)}>
                        <AvatarImage src={displayUser?.avatarUrl || ''} alt={displayUser?.name || 'User'} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">{displayAuthUser?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl p-2">
                    <DropdownMenuLabel className="font-normal p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{displayUser?.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{displayAuthUser?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                          <Link href="/admin/dashboard"><LayoutDashboard className="mr-2 h-4 w-4 text-primary" />Admin Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                      <Link href="/profile"><UserIcon className="mr-2 h-4 w-4 text-primary" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                      <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4 text-primary" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-lg focus:bg-red-500/10 focus:text-red-500 cursor-pointer text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}


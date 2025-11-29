
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { createUserProfile } from '@/lib/auth-utils';
import { Logo } from '@/components/logo';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);



  const handleLoginSuccess = async (user: User) => {
    // CRITICAL: Always redirect admin to verify-admin, ignoring other checks
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pkasingh68@gmail.com';
    if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
      router.push('/verify-admin');
      return;
    }

    if (!firestore || !auth) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    let userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await createUserProfile(firestore, user);
      userDoc = await getDoc(userDocRef);
    }

    const profileData = userDoc.data();

    // For email/password sign-ins, check if the email has been verified
    if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
      router.push(`/verify-email?email=${user.email}`);
      return;
    }

    if (profileData?.status === 'Suspended') {
      toast({ title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.', variant: 'destructive' });
      await auth.signOut();
      return;
    }

    router.push('/profile');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);

    // Check for specific admin email from environment variable
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'pkasingh68@gmail.com';

    try {
      // Normalize emails for comparison
      const normalizedInputEmail = email.trim().toLowerCase();
      const normalizedAdminEmail = adminEmail?.trim().toLowerCase();

      if (normalizedInputEmail === normalizedAdminEmail) {
        // CRITICAL: Verify password with Firebase FIRST.
        // If the password is wrong, this line will throw an error and jump to the catch block.
        // The user will NOT be redirected if the password is incorrect.
        await signInWithEmailAndPassword(auth, email, password);

        // Only if password verification succeeds, redirect to the secondary admin verification page.
        router.push('/verify-admin');
        return;
      }

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await handleLoginSuccess(user);

    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          description = 'No account found with this email. Please create an account first.';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'Invalid credentials. Please check your email and password and try again.';
          break;
        case 'auth/too-many-requests':
          description = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
          break;
        case 'auth/user-disabled':
          description = 'Your account has been disabled by an administrator.';
          break;
        case 'auth/network-request-failed':
          description = 'A network error occurred. Please check your internet connection and try again.';
          break;
        default:
          description = `An unexpected error occurred: ${error.message}`;
          break;
      }
      toast({
        title: 'Login Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      await handleLoginSuccess(user);
    } catch (error: any) {
      toast({
        title: t('login.googleFailTitle'),
        description: error.message || t('login.googleFailDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-50 via-purple-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-black"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-50 animate-blob-1 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/30 to-purple-200/30 rounded-full blur-3xl opacity-50 animate-blob-2 -z-10"></div>

      {/* 3D Background Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none -z-10 animate-float">
        <img
          src="/hero-sphere.png"
          alt="3D Abstract Sphere"
          className="w-full h-full object-contain"
        />
      </div>

      <Card className="w-full max-w-md mx-auto border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center p-6 space-y-2">
          <Link href="/" className="mx-auto inline-block mb-4 transition-transform hover:scale-105">
            <Logo className="justify-center" iconClassName="h-10 w-10" textClassName="text-3xl" />
          </Link>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('login.title')}
          </CardTitle>
          <CardDescription className="text-base">
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleEmailLogin} className="grid gap-6">
            <Button variant="outline" className="w-full h-12 rounded-full border-2 hover:bg-white/50 hover:border-primary/20 transition-all duration-300" type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-5 w-5">
                  <path fill="#4285F4" d="M44,24c0-1.8-0.2-3.6-0.5-5.3H24v10.5h11.2c-0.5,3.4-1.9,6.3-4.1,8.3v6.8h8.7C41.8,39.3,44,32.2,44,24z" />
                  <path fill="#34A853" d="M24,45c6.5,0,12-2.1,16-5.7l-8.7-6.8c-2.1,1.4-4.8,2.2-7.3,2.2c-5.6,0-10.4-3.8-12.1-8.9H3.1v7.1 C7.1,40.1,15,45,24,45z" />
                  <path fill="#FBBC05" d="M11.9,27.2c-0.4-1.2-0.6-2.5-0.6-3.8s0.2-2.6,0.6-3.8V12.5H3.1C1.2,16.4,0,20.8,0,25.6 c0,4.8,1.2,9.2,3.1,13.1L11.9,27.2z" />
                  <path fill="#EA4335" d="M24,11.3c3.5,0,6.6,1.2,9.1,3.6l7.7-7.7C36,1.8,30.5,0,24,0C15,0,7.1,4.9,3.1,12.5l8.8,7.1 C13.6,15.1,18.4,11.3,24,11.3z" />
                </svg>
              )}
              {t('login.continueWithGoogle')}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">{t('login.or')}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="ml-1">{t('login.emailLabel')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="h-12 pl-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="ml-1">{t('login.passwordLabel')}</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="password" type={showPassword ? "text" : "password"} required className="h-12 pl-10 pr-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember-me" className="rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">{t('login.rememberMe')}</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-full text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Login
            </Button>

          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              {t('login.noAccount')}{' '}
              <Link href="/signup" className="font-bold text-primary hover:underline">
                {t('login.signUpLink')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

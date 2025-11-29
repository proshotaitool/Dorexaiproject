
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, sendEmailVerification, type User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { createUserProfile } from '@/lib/auth-utils';
import { doc, getDoc } from 'firebase/firestore';
import { Logo } from '@/components/logo';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignupSuccess = async (user: FirebaseUser) => {
    if (!firestore) return;

    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await createUserProfile(firestore, user, { name: fullName || user.displayName });
    }

    if (user.providerData.some(p => p.providerId === 'password')) {
      await sendEmailVerification(user);
      router.push(`/verify-email?email=${email}`);
    } else {
      const updatedUserDoc = await getDoc(userDocRef);
      const profileData = updatedUserDoc.data();
      if (profileData?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/profile');
      }
    }
  }


  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: t('signup.agreementRequiredTitle'), description: t('signup.agreementRequiredDescription'), variant: 'destructive' });
      return;
    }
    if (!auth || !firestore) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await handleSignupSuccess(userCredential.user);
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'This email address is already in use. Please log in or use a different email.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. Please choose a stronger password (at least 6 characters).';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid. Please enter a correct email.';
          break;
        default:
          description = 'Could not create an account. Please check your details and try again.';
          break;
      }
      toast({
        title: 'Signup Failed',
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
      await handleSignupSuccess(user);
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
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{t('signup.title')}</CardTitle>
          <CardDescription className="text-base">{t('signup.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleEmailSignup} className="grid gap-6">
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
              {t('signup.signUpWithGoogle')}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">{t('signup.or')}</span>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name" className="ml-1">{t('signup.fullNameLabel')}</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="full-name" placeholder="John Doe" required className="h-12 pl-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="ml-1">{t('signup.emailLabel')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="email" type="email" placeholder="m@example.com" required className="h-12 pl-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="ml-1">{t('signup.passwordLabel')}</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="password" type="password" required className="h-12 pl-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-1 rounded-md border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  {t('signup.agreeTo')}{' '}
                  <Link href="/terms-of-service" className="text-primary hover:underline font-medium">{t('signup.termsLink')}</Link>{' '}{t('signup.and')}{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline font-medium">{t('signup.privacyLink')}</Link>.
                </Label>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-full text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300" disabled={isLoading || isGoogleLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {t('signup.createAccountButton')}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {t('signup.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              {t('signup.signInLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

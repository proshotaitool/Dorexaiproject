
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { MailCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Logo } from '@/components/logo';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const auth = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!auth?.currentUser) {
      toast({ title: 'Not Signed In', description: 'Please sign up or log in first.', variant: 'destructive' });
      return;
    }
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({ title: 'Email Sent!', description: 'A new verification link has been sent to your email.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to resend verification email.', variant: 'destructive' });
    } finally {
      setIsResending(false);
    }
  }

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
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to <strong>{email || 'your email address'}</strong>. Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6 p-8 pt-0">
          <p className="text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder or click below to resend.
          </p>
          <Button onClick={handleResend} disabled={isResending} className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300">
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </Button>
          <Button variant="ghost" asChild className="hover:bg-transparent hover:text-primary transition-colors">
            <Link href="/login" className="font-semibold">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}

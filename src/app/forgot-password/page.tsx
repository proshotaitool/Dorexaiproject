
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { Mail, Loader2, Key } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setIsSent(true);
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/user-not-found') {
        description = 'No user found with this email address.';
      }
      toast({
        title: 'Error Sending Email',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Forgot Password?</CardTitle>
          <CardDescription className="text-base">{isSent ? 'An email has been sent.' : 'No worries, we\'ll send you reset instructions.'}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {isSent ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary mx-auto w-fit">
                <Mail className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground">If an account exists for <strong className="text-foreground">{email}</strong>, you will receive an email with a link to reset your password. Please check your spam folder if you don't see it.</p>
              <Button asChild className="w-full h-12 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input id="email" type="email" placeholder="m@example.com" required className="h-12 pl-10 rounded-xl bg-white/50 border-primary/10 focus:border-primary/50 focus:bg-white/80 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-full text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-bold text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

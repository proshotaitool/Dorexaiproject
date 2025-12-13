'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, Lock, Mail, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginAdmin, verifyCodeAndSendOtp, verifyOtpAndGrantAccess, resendOtp } from '@/app/actions'; // Import new actions
import { useEffect } from 'react';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function VerifyAdminPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Steps: 0 = Login, 1 = Secret Code, 2 = OTP
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [otp, setOtp] = useState('');

    const auth = useAuth();
    const firestore = useFirestore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            const res = await loginAdmin(formData);
            if (res.success) {
                // Sync with Firebase Auth
                if (auth) {
                    try {
                        await signInWithEmailAndPassword(auth, email, password);
                    } catch (fbError: any) {
                        console.log("Firebase Login Failed, trying creation:", fbError.code);
                        if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
                            try {
                                await createUserWithEmailAndPassword(auth, email, password);
                            } catch (createError) {
                                console.error("Firebase Creation Failed:", createError);
                                // Optional: Warn user, but maybe proceed if they only need panel valid via Server Actions? 
                                // But Dashboard needs Firebase Auth. So we should probably warn.
                                toast({ title: 'Warning', description: 'Firebase account creation failed. Dashboard data may not load.', variant: 'destructive' });
                            }
                        }
                    }
                }

                setStep(1);
                toast({ title: 'Credentials Verified', description: 'Please enter the security code.' });
            } else {
                toast({ title: 'Login Failed', description: res.error || 'Invalid credentials', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await verifyCodeAndSendOtp(code);
            if (res.success) {
                setStep(2);
                toast({ title: 'OTP Sent', description: 'Check your registered email for the code.' });
            } else {
                toast({ title: 'Verification Failed', description: res.error || 'Invalid code', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Could not verify code.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setIsLoading(true);
        try {
            const res = await resendOtp();
            if (res.success) {
                setTimer(30);
                toast({ title: 'OTP Resent', description: 'Check your email for the new code.' });
            } else {
                toast({ title: 'Failed to Resend', description: res.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Could not resend OTP.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await verifyOtpAndGrantAccess(otp);
            if (res.success) {
                // Grant Firestore Admin Role
                if (auth?.currentUser && firestore) {
                    try {
                        const userRef = doc(firestore, 'users', auth.currentUser.uid);
                        await setDoc(userRef, { role: 'admin' }, { merge: true });
                    } catch (fsError) {
                        console.error("Firestore update failed", fsError);
                        // Continue anyway since session cookie is set
                    }
                }

                toast({ title: 'Access Granted', description: 'Welcome to the Admin Panel.' });
                router.push('/admin/dashboard');
            } else {
                toast({ title: 'Access Denied', description: res.error || 'Invalid OTP', variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Verification failed.', variant: 'destructive' });
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

            <Card className="w-full max-w-md mx-auto border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-500">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 scale-90">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {step === 0 && 'Admin Login'}
                        {step === 1 && 'Security Check'}
                        {step === 2 && 'Verify Identity'}
                    </CardTitle>
                    <CardDescription>
                        {step === 0 && 'Enter your administrator credentials.'}
                        {step === 1 && 'Enter the secret security code.'}
                        {step === 2 && 'Enter the OTP sent to your email.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    {step === 0 && (
                        <form onSubmit={handleLogin} className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" type="email" placeholder="admin@dorexai.space" required className="pl-9 bg-white/50" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="password" type="password" placeholder="••••••••" required className="pl-9 bg-white/50" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full mt-2 font-bold shadow-md">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue
                            </Button>
                        </form>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleCodeSubmit} className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Security Code</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="code" type="password" placeholder="Enter secure code" required className="pl-9 h-12 text-lg tracking-widest bg-white/50" value={code} onChange={e => setCode(e.target.value)} autoFocus />
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full mt-2 font-bold shadow-md">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & Send OTP
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleOtpSubmit} className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid gap-2">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input id="otp" type="text" placeholder="123456" maxLength={6} required className="pl-9 h-12 text-xl tracking-[0.5em] font-mono text-center bg-white/50" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-1">Check your inbox for a 6-digit code.</p>
                            </div>
                            <Button type="button" variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary" onClick={handleResendOtp} disabled={timer > 0 || isLoading}>
                                {timer > 0 ? `Resend code in ${timer}s` : 'Resend OTP'}
                            </Button>
                            <Button type="submit" disabled={isLoading} className="w-full mt-2 font-bold shadow-md bg-green-600 hover:bg-green-700">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify Access
                            </Button>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}

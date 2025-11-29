'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyAdminCode } from '@/app/actions';
import { Logo } from '@/components/logo';
import { useAuth, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function VerifyAdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const firestore = useFirestore();

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const isValid = await verifyAdminCode(code);
            if (isValid) {
                // Automatically grant admin role in Firestore
                if (auth?.currentUser && firestore) {
                    const userRef = doc(firestore, 'users', auth.currentUser.uid);
                    await setDoc(userRef, { role: 'admin' }, { merge: true });
                }

                toast({ title: 'Verification Successful', description: 'Access granted. Admin privileges activated.' });
                router.push('/admin/dashboard');
            } else {
                toast({
                    title: 'Verification Failed',
                    description: 'Invalid verification code.',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong. Please try again.',
                variant: 'destructive'
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

            <Card className="w-full max-w-md mx-auto border-white/40 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Verification</CardTitle>
                    <CardDescription>
                        Please enter the secure code to access the admin panel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerification} className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Security Code</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="code"
                                    type="password"
                                    placeholder="Enter code"
                                    required
                                    className="h-12 pl-10 rounded-xl bg-white/50"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-full font-bold shadow-lg" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Verify Access
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

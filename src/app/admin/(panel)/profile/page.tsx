
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth, useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function AdminProfilePage() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: profileLoading } = useDoc(userDocRef);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAvatarUrl(userProfile.avatarUrl || null);
    }
  }, [userProfile]);

  const handleProfileUpdate = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userDocRef, { name, avatarUrl });
      toast({ title: 'Success', description: 'Your profile has been updated.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!authUser || !currentPassword) {
      toast({ title: 'Error', description: 'Please enter your current password.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    
    setIsPasswordSaving(true);
    try {
      if (!authUser.email) throw new Error("User email is not available.");

      const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
      await reauthenticateWithCredential(authUser, credential);
      await updatePassword(authUser, newPassword);

      toast({ title: 'Success', description: 'Your password has been changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
        let description = 'Failed to change password. Please try again.';
        if (error.code === 'auth/wrong-password') {
            description = 'The current password you entered is incorrect.';
        }
        console.error(error);
        toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
        setIsPasswordSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold">User not found</h2>
        <p className="text-muted-foreground">Could not load user profile data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-admin-muted-foreground">Manage your personal account details.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src={avatarUrl || userProfile.avatarUrl} alt={name} />
                        <AvatarFallback className="text-xl">{name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                    <Button variant="outline" onClick={() => avatarInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Change</Button>
                    {avatarUrl && <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setAvatarUrl(null)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={userProfile.email} disabled />
              </div>
            </CardContent>
            <CardContent>
              <Button onClick={handleProfileUpdate} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
            </CardContent>
             <CardContent>
              <Button onClick={handlePasswordChange} disabled={isPasswordSaving}>
                {isPasswordSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={avatarUrl || userProfile.avatarUrl} alt={name} />
                <AvatarFallback className="text-3xl">{name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{name}</h3>
              <p className="text-admin-muted-foreground">{userProfile.email}</p>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary">{userProfile.plan}</Badge>
                <Badge>{userProfile.role}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

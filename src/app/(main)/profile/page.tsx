
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { deleteUser, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Shield, User as UserIcon, Settings, BarChart2, Gem, Bell, Lock, HelpCircle, ArrowRight, Save, Upload, Edit, Trash2, Database, Wrench, Star, MoreVertical, Share2, LayoutDashboard, Infinity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePreviewMode } from '@/hooks/usePreviewMode';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { ToolCard } from '@/components/tool-card';
import { tools } from '@/lib/tools';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const dummyUser = {
  uid: 'dummy-user-id',
  displayName: 'Jane Doe (Preview)',
  email: 'jane.doe@example.com',
  photoURL: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2MjMzOTU2MHww&ixlib=rb-4.1.0&q=80&w=1080',
};

const dummyProfile = {
  name: 'Jane Doe (Preview)',
  email: 'jane.doe@example.com',
  credits: 150,
  avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2MjMzOTU2MHww&ixlib=rb-4.1.0&q=80&w=1080',
  avatarStyle: 'border-primary',
  plan: 'Pro',
  status: 'Active',
  joined: { toDate: () => new Date() },
  role: 'user',
  favoriteTools: [],
};


const AdminProfileView = ({ user, profile }: { user: any, profile: any }) => {
  const { enterPreviewMode } = usePreviewMode();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className={cn("w-16 h-16 text-3xl", profile.avatarStyle)}>
              <AvatarImage src={profile.avatarUrl || user.photoURL || ''} alt={profile.name} />
              <AvatarFallback>{profile.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.name} (Admin)</h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                <Shield className="mr-2 h-4 w-4" />
                <span>Administrator Account</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/admin/dashboard"><Shield className="mr-2 h-4 w-4" /> Admin Panel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Website Preview
          </CardTitle>
          <CardDescription>
            See how the website appears from a regular user's perspective.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="secondary" className="w-full" onClick={enterPreviewMode}>
                <UserIcon className="mr-2 h-4 w-4" /> Preview as Dummy User
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const UserProfileView = ({ user, profile, onUpdate }: { user: any, profile: any, onUpdate: (data: Partial<any>) => void }) => {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [name, setName] = useState(profile?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isDeleting, setIsDeleting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Account', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'subscription', label: 'Subscription', icon: Gem },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];
  
  useEffect(() => {
    if(profile) {
      setName(profile.name);
    }
  }, [profile]);
  
  const favoriteTools = useMemo(() => {
    if (!profile?.favoriteTools) return [];
    return tools.filter(tool => profile.favoriteTools.includes(tool.path));
  }, [profile]);


  const handleSave = async () => {
    if (name === profile.name) return;
    setIsSaving(true);
    try {
      await onUpdate({ name });
      toast({ title: "Profile updated successfully!" });
    } catch(e) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" });
        return;
    }
    
    if (file.size > 1024 * 1024) { // 1MB limit
        toast({ title: "File Too Large", description: "Please select an image smaller than 1MB.", variant: "destructive" });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onUpdate({ avatarUrl: dataUrl });
        toast({ title: "Avatar Updated", description: "Your new profile picture has been saved." });
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveAvatar = () => {
    onUpdate({ avatarUrl: null });
    toast({ title: "Avatar Removed", description: "Your profile picture has been removed." });
  }

  const handlePasswordChange = async () => {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
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
    if (!oldPassword) {
        toast({ title: 'Error', description: 'Please enter your current password.', variant: 'destructive' });
        return;
    }

    setIsPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: 'Success', description: 'Your password has been changed.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
        console.error(error);
        let description = 'Failed to change password. Please try again.';
        if (error.code === 'auth/wrong-password') {
          description = 'The current password you entered is incorrect.';
        } else if (error.code === 'auth/requires-recent-login') {
          description = 'This is a sensitive operation. Please log out and log back in before changing your password.';
        }
        toast({ title: 'Error', description, variant: 'destructive' });
    } finally {
        setIsPasswordSaving(false);
    }
  };


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore) {
        toast({ title: "Error", description: "Could not delete account. User not found.", variant: "destructive" });
        return;
    }
    setIsDeleting(true);
    try {
        // 1. Delete user data from Firestore
        await deleteDoc(doc(firestore, 'users', user.uid));

        // 2. Delete the user from Firebase Authentication
        await deleteUser(user);
        
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        router.push('/');
    } catch (error: any) {
        console.error("Account deletion error:", error);
        let description = "An error occurred. Please try again.";
        if (error.code === 'auth/requires-recent-login') {
            description = "This is a sensitive operation. Please log out and log back in before deleting your account.";
        }
        toast({ title: "Deletion Failed", description, variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };
  
    const handleRemoveFavorite = async (toolPath: string) => {
    if (!user || !firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        favoriteTools: arrayRemove(toolPath)
      });
      toast({
        title: 'Removed from Favorites',
        description: 'This tool has been removed from your favorites.',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update favorites.', variant: 'destructive' });
    }
  };

  const handleShareTool = async (toolPath: string) => {
    const url = `${window.location.origin}${toolPath}`;
    const shareData = {
      title: 'ProShot AI Tool',
      text: `Check out this tool on ProShot AI!`,
      url,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
      <Card className="self-start md:sticky md:top-24">
        <CardHeader className="text-center p-4">
           <Avatar className={cn("w-24 h-24 mx-auto mb-4 border-4", profile.avatarStyle)}>
            <AvatarImage src={profile.avatarUrl || user.photoURL || ''} alt={profile.name} />
            <AvatarFallback className="text-3xl">{profile.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{profile.name}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
           <div className="flex items-center justify-center gap-2 mt-2">
              <Gem className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{profile.plan} Plan</span>
          </div>
        </CardHeader>
        <CardContent className="p-2">
            <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                <Label htmlFor="profile-completion" className="text-xs text-muted-foreground">Profile Completion</Label>
                <Progress value={75} id="profile-completion" className="h-2 w-3/4" />
            </div>
            <Separator />
            <nav className="flex flex-col gap-1 p-2">
                {tabs.map(tab => (
                     <Button 
                        key={tab.id} 
                        variant={activeTab === tab.id ? "secondary" : "ghost"} 
                        className="justify-start"
                        onClick={() => setActiveTab(tab.id)}
                     >
                        <tab.icon className="mr-2 h-4 w-4" />
                        {tab.label}
                    </Button>
                ))}
            </nav>
             <Separator className="my-2"/>
             <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4"/>Dashboard</Link>
             </Button>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {activeTab === 'profile' && (
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Manage your public profile and basic information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className={cn("w-16 h-16", profile.avatarStyle)}>
                                <AvatarImage src={profile.avatarUrl || user.photoURL || ''} alt={profile.name} />
                                <AvatarFallback className="text-xl">{profile.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => avatarInputRef.current?.click()}><Upload className="mr-2"/>Change</Button>
                                {profile.avatarUrl && <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleRemoveAvatar}><Trash2/>Remove</Button>}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" defaultValue={profile.name?.toLowerCase().replace(/\s/g, '') || ''} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address (account ID)</Label>
                        <Input id="email" type="email" value={profile.email} disabled />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving || name === profile.name}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Changes
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {activeTab === 'settings' && (
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 divide-y">
                     <div className="space-y-4 pt-4 first:pt-0">
                        <h3 className="font-semibold">Change Password</h3>
                        <div className="space-y-2">
                            <Label htmlFor="old-password">Current Password</Label>
                            <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        <Button onClick={handlePasswordChange} disabled={isPasswordSaving || !oldPassword || !newPassword || !confirmPassword}>
                            {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                    <div className="space-y-4 pt-6">
                        <h3 className="font-semibold">Notification Preferences</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between"><Label htmlFor="email-notifications" className="font-normal">Email Notifications</Label><Switch id="email-notifications" defaultChecked /></div>
                            <div className="flex items-center justify-between"><Label htmlFor="browser-notifications" className="font-normal">Browser Notifications</Label><Switch id="browser-notifications"/></div>
                        </div>
                    </div>
                    <div className="space-y-2 pt-6">
                        <h3 className="font-semibold">Language</h3>
                        <p className="text-sm text-muted-foreground">Change your preferred language in the header dropdown.</p>
                    </div>
                </CardContent>
            </Card>
        )}

        {activeTab === 'analytics' && (
           <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Activity</CardTitle>
                        <CardDescription>This is a summary of your activity on the platform. Real-time logging is not yet implemented.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className='text-sm font-medium'>Tasks This Month</CardTitle>
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">0</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className='text-sm font-medium'>Data Processed</CardTitle>
                                <Database className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">0 GB</p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Activity Yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Once you start using tools, your activity will appear here.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {activeTab === 'favorites' && (
            <Card>
                <CardHeader>
                    <CardTitle>Favorite Tools</CardTitle>
                    <CardDescription>Your hand-picked collection of most-used tools for quick access.</CardDescription>
                </CardHeader>
                <CardContent>
                    {favoriteTools.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {favoriteTools.map(tool => (
                                <div key={tool.path} className="relative group">
                                    <ToolCard tool={tool} />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-7 w-7">
                                                    <MoreVertical className="h-4 w-4"/>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleShareTool(tool.path)}><Share2 className="mr-2 h-4 w-4"/> Share</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveFavorite(tool.path)}><Trash2 className="mr-2 h-4 w-4"/> Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                            <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Favorite Tools Yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Add tools to your favorites for quick access.</p>
                            <Button asChild className="mt-4">
                                <Link href="/tools">Explore Tools</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}

        {activeTab === 'subscription' && (
            <Card>
                <CardHeader>
                    <CardTitle>Subscription & Billing</CardTitle>
                    <CardDescription>You are currently on the <span className="font-bold text-primary">{profile.plan}</span> plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <p>Plan Credits</p>
                            <p className="font-semibold flex items-center gap-1"><Infinity className="h-4 w-4"/> Unlimited</p>
                        </div>
                        <Progress value={100} className="mt-2 h-2" />
                    </div>
                    <Button asChild>
                        <Link href="/pricing">
                            View Plans <ArrowRight className="ml-2"/>
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications from us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="email-notifications" className="font-semibold">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive important updates and news via email.</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="browser-notifications" className="font-semibold">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get instant alerts for completed tasks.</p>
                </div>
                <Switch id="browser-notifications" />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account's security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 divide-y">
                    <div className="pt-4 first:pt-0">
                        <Label className="font-semibold">Active Sessions</Label>
                        <p className="text-sm text-muted-foreground mb-2">This will log you out from all devices except this one.</p>
                        <Button variant="secondary" onClick={handleLogout}>Logout From All Other Devices</Button>
                    </div>
                    <div className="pt-6">
                         <Card className="border-destructive">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                    <div>
                                        <p className="font-semibold">Delete Your Account</p>
                                        <p className="text-sm text-muted-foreground">This will permanently delete your account and all associated data.</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={isDeleting}>
                                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete Account
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your
                                                account and remove your data from our servers.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteAccount}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        )}
        
        {activeTab === 'help' && (
          <Card>
            <CardHeader>
              <CardTitle>Help &amp; Support</CardTitle>
              <CardDescription>Need help? Here are some resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Button variant="outline" asChild className="w-full justify-start"><Link href="/contact">Contact Support</Link></Button>
               <Button variant="outline" asChild className="w-full justify-start"><Link href="/faq">Frequently Asked Questions</Link></Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, profile, isLoading } = useUser();
  const firestore = useFirestore();
  const { isPreviewing } = usePreviewMode();

  const handleUpdate = async (data: Partial<any>) => {
    if (isPreviewing) return; // Don't allow updates in preview mode
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, data);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (isPreviewing) {
    return (
      <div className="container py-12">
        <UserProfileView user={dummyUser} profile={dummyProfile} onUpdate={() => {}} />
      </div>
    );
  }
  
  const isAdmin = !isPreviewing && profile?.role === 'admin';

  if (!user || !profile) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">You are not logged in.</h1>
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12">
      {isAdmin ? (
        <AdminProfileView user={user} profile={profile} />
      ) : (
        <UserProfileView user={user} profile={profile} onUpdate={handleUpdate} />
      )}
    </div>
  );
}

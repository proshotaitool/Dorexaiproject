
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, Save, Key, Mail, Lock, Shield, Link as LinkIcon, Users2, Building, CreditCard, Bot, BarChart, CircleDot, Globe, Sun, Image as ImageIcon, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { logAction } from '@/lib/logger';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: any;
}


export default function SettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const [isSaving, setIsSaving] = useState(false);
  const [userEmailToUpdate, setUserEmailToUpdate] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  const logsCollection = firestore ? query(collection(firestore, 'audit-logs'), orderBy('timestamp', 'desc')) : null;
  const { data: logs, isLoading: logsLoading } = useCollection<AuditLog>(logsCollection as any);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGrantAdmin = async () => {
    if (!userEmailToUpdate.trim() || !firestore || !currentUser) {
      toast({ title: 'Error', description: 'Please enter a valid user email.', variant: 'destructive' });
      return;
    }

    setIsGranting(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', userEmailToUpdate));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'User Not Found', description: `No user found with email ${userEmailToUpdate}.`, variant: 'destructive' });
        setIsGranting(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'users', userDoc.id), { role: 'admin' });

      await logAction(firestore, currentUser, `Granted admin rights to ${userEmailToUpdate}`);

      await batch.commit();

      toast({ title: 'Success', description: `${userEmailToUpdate} has been granted admin rights.` });
      setUserEmailToUpdate('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to grant admin rights.', variant: 'destructive' });
    } finally {
      setIsGranting(false);
    }
  };


  const handleSaveSettings = () => {
    setIsSaving(true);
    // Placeholder for saving logic
    setTimeout(() => {
      toast({
        title: "Settings Saved (Draft)",
        description: "Your changes have been saved as a draft. Click 'Push Live Updates' to publish.",
      });
      setIsSaving(false);
    }, 1500);
  }

  const handlePushLive = () => {
    toast({
      title: "Pushed to Live!",
      description: "All pending changes have been published."
    });
  }

  const pendingChanges = [
    { id: 1, description: 'Updated Site Name to "ProShot AI Suite"' },
    { id: 2, description: 'Enabled "Allow user registration" in Security' },
    { id: 3, description: 'Changed default user role to "Contributor"' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-admin-muted-foreground">Manage your application's global settings.</p>
        </div>
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <CircleDot className="mr-2 h-4 w-4" />
                Push Live Updates ({pendingChanges.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  Confirm Live Update
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to push the following changes to your live website. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                <h4 className="font-semibold">Pending Changes:</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {pendingChanges.map(change => (
                    <li key={change.id}>{change.description}</li>
                  ))}
                </ul>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePushLive}>Confirm & Push Live</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
        </div>
      </div>
      <Tabs defaultValue="General" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="General">General</TabsTrigger>
          <TabsTrigger value="Security">Security</TabsTrigger>
          <TabsTrigger value="Integrations">Integrations</TabsTrigger>
          <TabsTrigger value="API Keys">API Keys</TabsTrigger>
          <TabsTrigger value="Real-time-Updates">Real-time Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="General" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage basic site information, branding, and maintenance status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" defaultValue="ProShot AI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description / Tagline</Label>
                  <Input id="site-description" defaultValue="Smart tools for all your PDF, image & document needs." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Logo Upload</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 border flex items-center justify-center rounded-md bg-muted/50">
                      {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="h-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <Input id="logo-upload" type="file" onChange={(e) => handleImageChange(e, setLogoPreview)} className="text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon-upload">Favicon Upload (.ico)</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 border flex items-center justify-center rounded-md bg-muted/50">
                      {faviconPreview ? <img src={faviconPreview} alt="Favicon Preview" className="h-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <Input id="favicon-upload" type="file" accept=".ico,.png,.svg" onChange={(e) => handleImageChange(e, setFaviconPreview)} className="text-sm" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="homepage-message">Homepage Message / Notice</Label>
                <Input id="homepage-message" placeholder="🎉 New AI tools launched!" />
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Temporarily disable public access to the site.</p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea id="maintenance-message" placeholder="We’re performing scheduled maintenance. We’ll be back online shortly!" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Security" className="pt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Roles & Permissions</CardTitle>
                <CardDescription>Grant or revoke admin privileges for users.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="w-full space-y-2">
                  <Label htmlFor="user-email">User Email</Label>
                  <Input id="user-email" type="email" placeholder="user@example.com" value={userEmailToUpdate} onChange={e => setUserEmailToUpdate(e.target.value)} />
                </div>
                <Button onClick={handleGrantAdmin} disabled={isGranting} className="mt-auto bg-green-600 hover:bg-green-700">
                  {isGranting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                  Grant Admin Rights
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Admin Account Security</CardTitle>
                <CardDescription>Manage the primary admin account credentials and verification code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Admin Verification Code</Label>
                  <Input id="verification-code" type="password" />
                </div>
                <div className="flex justify-end">
                  <Button variant="destructive">Save Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Integrations" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Connect and manage external services.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Google</CardTitle>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-6 w-6" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Connect with Google services for authentication and analytics.</p>
                  <Button variant="outline">Manage</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Payment Gateway</CardTitle>
                  <CreditCard className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Integrate with Stripe or another gateway to handle payments.</p>
                  <Button variant="outline">Connect</Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="API Keys" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Store and manage API keys for external services.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Firebase</CardTitle>
                  <img src="https://www.firebase.com/favicon.ico" alt="Firebase" className="h-6 w-6" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Configuration for Firebase services.</p>
                  <Button variant="outline">Manage</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">OpenAI</CardTitle>
                  <Bot className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">API key for AI-based features.</p>
                  <Button variant="outline">Manage</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Google Analytics</CardTitle>
                  <BarChart className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Analytics and tracking ID.</p>
                  <Button variant="outline">Manage</Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Real-time-Updates" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Activity</CardTitle>
              <CardDescription>A real-time log of changes made in the admin panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {logsLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : logs && logs.length > 0 ? (
                  logs.map(log => (
                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Save className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          <span className="font-bold">{log.userEmail}</span> {log.action.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">No recent activity.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

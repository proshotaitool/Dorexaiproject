
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useAuth, useUser, useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, orderBy, where, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { logAction } from '@/lib/logger';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: any;
}

interface GlobalSettings {
  siteName: string;
  description: string;
  logoUrl?: string; // Stored as base64 for now or URL
  faviconUrl?: string;
  language: string;
  homepageMessage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function SettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser, profile } = useUser();
  const firestore = useFirestore();

  const [isSaving, setIsSaving] = useState(false);
  const [userEmailToUpdate, setUserEmailToUpdate] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  // Settings State
  const [siteName, setSiteName] = useState('DoreX Ai');
  const [description, setDescription] = useState('Smart tools for all your PDF, image & document needs.');
  const [language, setLanguage] = useState('en');
  const [homepageMessage, setHomepageMessage] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('We’re performing scheduled maintenance. We’ll be back online shortly!');

  // Fetch Global Settings
  const settingsDocRef = useMemo(() => firestore ? doc(firestore, 'global-settings', 'general') : null, [firestore]);
  const { data: globalSettings, isLoading: settingsLoading } = useDoc(settingsDocRef);

  useEffect(() => {
    if (globalSettings) {
      setSiteName(globalSettings.siteName || 'DoreX Ai');
      setDescription(globalSettings.description || '');
      setLanguage(globalSettings.language || 'en');
      setHomepageMessage(globalSettings.homepageMessage || '');
      setMaintenanceMode(globalSettings.maintenanceMode || false);
      setMaintenanceMessage(globalSettings.maintenanceMessage || 'We’re performing scheduled maintenance.');
      if (globalSettings.logoUrl) setLogoPreview(globalSettings.logoUrl);
      if (globalSettings.faviconUrl) setFaviconPreview(globalSettings.faviconUrl);
    }
  }, [globalSettings]);

  const isAdmin = (profile as any)?.role === 'admin';
  const logsCollection = useMemo(() => (firestore && isAdmin) ? query(collection(firestore, 'audit-logs'), orderBy('timestamp', 'desc')) : null, [firestore, isAdmin]);
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


  const handleSaveSettings = async () => {
    if (!firestore || !settingsDocRef) return;
    setIsSaving(true);
    try {
      const data: GlobalSettings = {
        siteName,
        description,
        language,
        homepageMessage,
        maintenanceMode,
        maintenanceMessage,
        logoUrl: logoPreview || undefined,
        faviconUrl: faviconPreview || undefined
      };
      await setDoc(settingsDocRef, data, { merge: true });

      // Log action
      if (currentUser) {
        await logAction(firestore, currentUser, "Updated Global Settings");
      }

      toast({
        title: "Settings Saved",
        description: "Global settings have been updated in the database.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  // This button is now essentially a "Manual Save" alias, or triggers a deploy hook in Vercel in real-world
  // For now, we'll make it commit any pending memory changes if we had them, OR just re-confirm
  const handlePushLive = async () => {
    // In this architecture, setDoc writes directly to DB, so "Save Settings" IS "Push Live" for content.
    // But we can keep this for "Deployment Triggers" if needed.
    // For now, let's just re-save to ensure consistency.
    await handleSaveSettings();
    toast({ title: "Live Sync", description: "Configuration synced with database." });
  }

  const pendingChanges = [
    { id: 1, description: 'Updated Site Name' },
    { id: 2, description: (maintenanceMode ? 'Enabled' : 'Disabled') + ' Maintenance Mode' },
  ];

  if (settingsLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

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
                Push Live Updates
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  Confirm Live Update
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will ensure your configuration matches the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                <h4 className="font-semibold">Current Configuration:</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Site Name: {siteName}</li>
                  <li>Maintenance Mode: {maintenanceMode ? 'ON' : 'OFF'}</li>
                </ul>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePushLive}>Confirm Sync</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
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
                  <Input id="site-name" value={siteName} onChange={e => setSiteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description / Tagline</Label>
                  <Input id="site-description" value={description} onChange={e => setDescription(e.target.value)} />
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
                  <Select value={language} onValueChange={setLanguage}>
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
                <Input id="homepage-message" value={homepageMessage} onChange={e => setHomepageMessage(e.target.value)} placeholder="🎉 New AI tools launched!" />
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Temporarily disable public access to the site.</p>
                  </div>
                  <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                {maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea id="maintenance-message" value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} />
                  </div>
                )}
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

          </div>
        </TabsContent>

        <TabsContent value="Integrations" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Connect and manage external services.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                Integrations configuration is coming soon.
              </div>
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
              <div className="p-4 text-muted-foreground text-sm border border-dashed rounded-lg">
                API Key management is securely handled via server-side environment variables. GUI coming soon.
              </div>
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

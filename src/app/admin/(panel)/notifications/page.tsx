
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, Bell, MessageSquare, AlertTriangle, Info, CheckCircle, Edit, Trash2, MoreVertical, Upload, Image as ImageIcon, MessageCircle as SnackbarIcon, AlertCircle as InlineAlertIcon, Search, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type NotificationType = 'Banner' | 'Modal Popup' | 'Toast' | 'Snackbar' | 'Inline Alert';
type NotificationVariant = 'Success' | 'Info' | 'Warning' | 'Error';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variant: NotificationVariant;
  date: any;
  imageUrl?: string | null;
}

const variantConfig = {
    Success: { icon: CheckCircle, color: 'text-green-500' },
    Info: { icon: Info, color: 'text-blue-500' },
    Warning: { icon: AlertTriangle, color: 'text-yellow-500' },
    Error: { icon: AlertTriangle, color: 'text-red-500' },
};

const typeConfig = {
    Banner: { icon: Bell },
    'Modal Popup': { icon: MessageSquare },
    Toast: { icon: Info },
    Snackbar: { icon: SnackbarIcon },
    'Inline Alert': { icon: InlineAlertIcon },
}

const NotificationForm = ({ onSave, onCancel, notification }: { onSave: (data: Omit<AppNotification, 'id' | 'date'>) => Promise<void>, onCancel: () => void, notification?: AppNotification | null }) => {
    const isEditing = !!notification;
    const [type, setType] = useState<NotificationType>(notification?.type || 'Banner');
    const [title, setTitle] = useState(notification?.title || '');
    const [message, setMessage] = useState(notification?.message || '');
    const [variant, setVariant] = useState<NotificationVariant>(notification?.variant || 'Info');
    const [imageUrl, setImageUrl] = useState<string | null>(notification?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async () => {
        if(!title || !message) return;
        setIsSubmitting(true);
        await onSave({ type, title, message, variant, imageUrl });
        setIsSubmitting(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    return (
        <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                    <SelectTrigger id="type">
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(typeConfig).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., System Maintenance" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g., Our services will be down for maintenance..." />
            </div>
             <div className="space-y-2">
                <Label htmlFor="variant">Variant / Style</Label>
                <Select value={variant} onValueChange={(v) => setVariant(v as NotificationVariant)}>
                    <SelectTrigger id="variant">
                        <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                         {Object.keys(variantConfig).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="image">Image (Optional)</Label>
                <Input id="image" type="file" onChange={handleImageUpload} accept="image/*" />
                {imageUrl && (
                    <div className="mt-2 relative w-32 h-32">
                        <Image src={imageUrl} alt="preview" fill className="rounded-md object-cover" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setImageUrl(null)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
             <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isEditing ? 'Save Changes' : 'Create Notification'}
                </Button>
            </DialogFooter>
        </div>
    )
}

export default function NotificationsPage() {
  const firestore = useFirestore();
  const notificationsCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'notifications'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: notifications, isLoading, error } = useCollection<AppNotification>(notificationsCollection);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<AppNotification | null>(null);
  const [deletingNotification, setDeletingNotification] = useState<AppNotification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleSave = async (data: Omit<AppNotification, 'id' | 'date'>) => {
    if (!firestore) return;
    try {
        if (editingNotification) {
            await updateDoc(doc(firestore, 'notifications', editingNotification.id), data);
            toast({ title: "Success", description: "Notification updated successfully." });
        } else {
            await addDoc(collection(firestore, 'notifications'), { ...data, date: serverTimestamp() });
            toast({ title: "Success", description: "Notification created successfully." });
        }
        setIsFormOpen(false);
        setEditingNotification(null);
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Could not save notification.", variant: 'destructive'});
    }
  };

  const handleCreate = () => {
    setEditingNotification(null);
    setIsFormOpen(true);
  }
  
  const handleEdit = (notification: AppNotification) => {
    setEditingNotification(notification);
    setIsFormOpen(true);
  }

  const handleDelete = async () => {
    if (!deletingNotification || !firestore) return;
    try {
        await deleteDoc(doc(firestore, 'notifications', deletingNotification.id));
        toast({ title: "Success", description: "Notification deleted."});
    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "Could not delete notification.", variant: 'destructive' });
    } finally {
        setDeletingNotification(null);
    }
  }

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    if (!searchTerm) return notifications;
    return notifications.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notifications, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-admin-muted-foreground">Send and manage notifications to your users.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>
            A log of all notifications that have been created.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
              <Input
                placeholder="Search notifications by title or message..."
                className="pl-10 h-10 w-full max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          {isLoading ? (
             <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-500">Error loading notifications.</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
              <h3 className="text-lg font-semibold">No Notifications</h3>
              <p className="mt-2 text-sm text-admin-muted-foreground">Click "Send Notification" to create one.</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
                <Search className="mx-auto h-12 w-12 text-admin-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Notifications Found</h3>
                <p className="mt-2 text-sm text-admin-muted-foreground">Your search for "{searchTerm}" did not match any notifications.</p>
            </div>
          ) : (
             <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Variant</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredNotifications.map(notification => {
                            const TypeIcon = typeConfig[notification.type].icon;
                            const VariantIcon = variantConfig[notification.variant].icon;
                            const variantColor = variantConfig[notification.variant].color;

                            return (
                                <TableRow key={notification.id}>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center gap-2">
                                            <TypeIcon className="h-4 w-4" />
                                            {notification.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{notification.title}</TableCell>
                                    <TableCell className="text-admin-muted-foreground max-w-xs truncate">{notification.message}</TableCell>
                                    <TableCell>
                                        {notification.imageUrl ? (
                                            <div className="w-10 h-10 rounded-md overflow-hidden">
                                                <Image src={notification.imageUrl} alt={notification.title} width={40} height={40} className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("flex items-center gap-2", variantColor)}>
                                            <VariantIcon className="h-4 w-4" />
                                            {notification.variant}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{notification.date?.toDate ? notification.date.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(notification)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500" onClick={() => setDeletingNotification(notification)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingNotification ? 'Edit Notification' : 'Create Notification'}</DialogTitle>
                <DialogDescription>
                    Configure and send a new notification to your users.
                </DialogDescription>
            </DialogHeader>
            <NotificationForm onSave={handleSave} onCancel={() => setIsFormOpen(false)} notification={editingNotification} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deletingNotification} onOpenChange={(open) => !open && setDeletingNotification(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the notification "{deletingNotification?.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({variant: 'destructive'})}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

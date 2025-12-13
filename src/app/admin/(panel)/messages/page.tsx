
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Mail, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'New' | 'Read' | 'Replied';
    createdAt: any;
}

export default function MessagesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null);

    const messagesCollection = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contact-messages'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: messages, isLoading, error } = useCollection<ContactMessage>(messagesCollection as any);

    const filteredMessages = useMemo(() => {
        if (!messages) return [];
        if (!searchTerm) return messages;
        return messages.filter(msg =>
            msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [messages, searchTerm]);

    const handleMarkAsRead = async (message: ContactMessage) => {
        if (!firestore || message.status !== 'New') return;
        try {
            await updateDoc(doc(firestore, 'contact-messages', message.id), { status: 'Read' });
        } catch (e) {
            console.error("Failed to mark as read:", e);
        }
    };

    const handleViewMessage = (message: ContactMessage) => {
        setSelectedMessage(message);
        if (message.status === 'New') {
            handleMarkAsRead(message);
        }
    };

    const handleDelete = async () => {
        if (!deletingMessage || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'contact-messages', deletingMessage.id));
            toast({ title: "Message Deleted", description: "The message has been removed." });
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Could not delete message.", variant: 'destructive' });
        } finally {
            setDeletingMessage(null);
            if (selectedMessage?.id === deletingMessage.id) {
                setSelectedMessage(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Messages</h1>
                    <p className="text-admin-muted-foreground">View and manage contact form submissions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Messages from your website's contact form.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
                        <Input
                            placeholder="Search messages..."
                            className="pl-10 h-10 w-full max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
                            <Mail className="mx-auto h-12 w-12 text-admin-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Messages</h3>
                            <p className="mt-2 text-sm text-admin-muted-foreground">You haven't received any messages yet.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMessages.map(msg => (
                                        <TableRow key={msg.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewMessage(msg)}>
                                            <TableCell>
                                                <Badge variant={msg.status === 'New' ? 'default' : 'secondary'}>
                                                    {msg.status || 'Read'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{msg.name}</span>
                                                    <span className="text-xs text-muted-foreground">{msg.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{msg.subject}</TableCell>
                                            <TableCell>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingMessage(msg); }} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{selectedMessage?.subject}</DialogTitle>
                        <DialogDescription>
                            From: {selectedMessage?.name} ({selectedMessage?.email})
                            <br />
                            Date: {selectedMessage?.createdAt?.toDate ? selectedMessage.createdAt.toDate().toLocaleString() : 'N/A'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedMessage?.message}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedMessage(null)}>Close</Button>
                        <Button asChild>
                            <a href={`mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`}>Reply via Email</a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingMessage} onOpenChange={(open) => !open && setDeletingMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

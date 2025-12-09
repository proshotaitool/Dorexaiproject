'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Save, Bookmark, Share2, Type } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { UserProfile } from '@/types';

export default function NotepadPage() {
    const [text, setText] = useState('');
    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

    const toolPath = '/tools/notepad';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    // Load from local storage on mount
    useEffect(() => {
        const savedText = localStorage.getItem('notepad-content');
        if (savedText) {
            setText(savedText);
        }
    }, []);

    // Auto-save to local storage
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('notepad-content', text);
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [text]);

    const handleFavorite = async () => {
        if (!userDocRef) return;
        try {
            await updateDoc(userDocRef, {
                favoriteTools: isFavorite ? arrayRemove(toolPath) : arrayUnion(toolPath)
            });
            toast({
                title: isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
                description: `This tool has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`,
            });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update favorites.', variant: 'destructive' });
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Online Notepad',
            text: 'Check out this simple Online Notepad tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const handleDownload = () => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notepad-content.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: 'Downloaded',
            description: 'Your note has been downloaded as a text file.',
        });
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear your note? This cannot be undone.')) {
            setText('');
            localStorage.removeItem('notepad-content');
            toast({
                title: 'Cleared',
                description: 'Notepad content has been cleared.',
            });
        }
    };

    const relatedTools = tools.filter(tool => ['/tools/text-summarization', '/tools/ai-content-generator'].includes(tool.path));

    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Breadcrumb className="flex justify-center mb-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/tools">Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/tools/text-ai">Text &amp; AI Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Notepad</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Online Notepad</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    A simple, distraction-free text editor that automatically saves your work in your browser. Write, edit, and download your notes instantly.
                </p>
            </div>

            <div className="flex justify-end gap-2 mb-4">
                {user && (
                    <Button onClick={handleFavorite} variant="outline" className={cn("rounded-full transition-colors", isFavorite ? "border-yellow-400 text-yellow-600 bg-yellow-100/50 hover:bg-yellow-100/80 hover:text-yellow-700" : "hover:bg-muted/50")}>
                        <Bookmark className={cn("mr-2 h-4 w-4", isFavorite && "fill-current")} />
                        {isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </Button>
                )}
                <Button onClick={handleShare} variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary transition-colors">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </div>

            <Card className="min-h-[500px] md:min-h-[600px] flex flex-col">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
                    <div className="space-y-1 w-full md:w-auto">
                        <CardTitle className="flex items-center text-xl">
                            <Type className="mr-2 h-5 w-5" /> Your Notes
                        </CardTitle>
                        <CardDescription>
                            Everything you type here is saved automatically.
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={handleClear} disabled={!text} className="flex-1 md:flex-none">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                        <Button onClick={handleDownload} disabled={!text} className="flex-1 md:flex-none">
                            <Download className="mr-2 h-4 w-4" />
                            Download .txt
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Start typing your notes here..."
                        className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 p-4 md:p-6 text-base md:text-lg leading-relaxed"
                        style={{ minHeight: '400px' }}
                    />
                </CardContent>
                <div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span>{text.length} characters | {text.split(/\s+/).filter(w => w.length > 0).length} words</span>
                    <span className="flex items-center"><Save className="h-3 w-3 mr-1" /> Auto-saved</span>
                </div>
            </Card>

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About Online Notepad</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Online Notepad is a free, browser-based text editor designed for simplicity and speed. Whether you need to jot down a quick thought, draft an email, or write a longer article, our tool provides a clean, distraction-free environment.
                            <br /><br />
                            One of the key features is <strong>auto-save</strong>. You don't need to worry about losing your work if you accidentally close the tab or your browser crashes. Your text is saved locally in your browser and will be there when you return. You can also download your notes as a standard text file (.txt) at any time.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

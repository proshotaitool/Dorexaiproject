'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, RefreshCw, Bookmark, Share2 } from 'lucide-react';
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
import { humanizeTextAction } from '@/app/actions/ai-tools';

export default function AiHumanizerPage() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

    const toolPath = '/tools/ai-humanizer';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    const handleHumanize = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        try {
            const result = await humanizeTextAction(inputText);
            if (result.success && result.data) {
                setOutputText(result.data.humanizedText);
                toast({ title: 'Success', description: 'Text humanized successfully.' });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to humanize text. Please try again.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(outputText);
        toast({ title: 'Copied', description: 'Text copied to clipboard.' });
    };

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
            title: 'AI Humanizer',
            text: 'Make your text sound more natural with AI Humanizer!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const relatedTools = tools.filter(tool => ['/tools/text-summarization', '/tools/ai-content-generator', '/tools/plagiarism-checker'].includes(tool.path));

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
                            <BreadcrumbLink href="/tools/text-ai">Text & AI</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>AI Humanizer</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">AI Humanizer</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Transform robotic AI-generated text into natural, human-like writing. Improve flow, readability, and engagement instantly.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Input Text</CardTitle>
                        <CardDescription>Paste your AI-generated or robotic text here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <Textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste text to humanize..."
                            className="flex-1 min-h-[300px] resize-none p-4 text-base"
                        />
                        <Button onClick={handleHumanize} disabled={!inputText || isLoading} className="mt-4 w-full">
                            {isLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Humanizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" /> Humanize Text
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Humanized Result</CardTitle>
                        <CardDescription>Your natural, human-like text will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <div className="flex-1 min-h-[300px] p-4 rounded-md border bg-muted/20 text-base whitespace-pre-wrap">
                            {outputText || <span className="text-muted-foreground italic">Result will appear here...</span>}
                        </div>
                        <Button onClick={handleCopy} disabled={!outputText} variant="outline" className="mt-4 w-full">
                            <Copy className="mr-2 h-4 w-4" /> Copy Result
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, RefreshCw, Bookmark, Share2, AlertTriangle, CheckCircle } from 'lucide-react';
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
import { checkPlagiarismAction } from '@/app/actions/ai-tools';

export default function PlagiarismCheckerPage() {
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<{ score: number; analysis: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

    const toolPath = '/tools/plagiarism-checker';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    const handleCheck = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        try {
            const output = await checkPlagiarismAction(inputText);
            if (output.success && output.data) {
                setResult(output.data);
                toast({ title: 'Analysis Complete', description: 'Originality check finished.' });
            } else {
                throw new Error(output.error);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to analyze text. Please try again.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
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
            title: 'Plagiarism Checker',
            text: 'Check your text for originality with this AI tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 70) return 'Original';
        if (score >= 40) return 'Mixed';
        return 'Likely AI/Generic';
    };

    const relatedTools = tools.filter(tool => ['/tools/ai-humanizer', '/tools/ai-content-generator'].includes(tool.path));

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
                            <BreadcrumbPage>Plagiarism Checker</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Originality & Plagiarism Checker</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Analyze your text for originality, robotic patterns, and AI generation markers. Get an instant score and detailed analysis.
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2 flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Input Text</CardTitle>
                        <CardDescription>Paste the text you want to analyze.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        <Textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Paste text here..."
                            className="flex-1 min-h-[300px] resize-none p-4 text-base"
                        />
                        <Button onClick={handleCheck} disabled={!inputText || isLoading} className="mt-4 w-full">
                            {isLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" /> Check Originality
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Analysis Result</CardTitle>
                        <CardDescription>Originality score and insights.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6">
                        {result ? (
                            <div className="space-y-6 w-full">
                                <div className="relative flex items-center justify-center">
                                    <div className={cn("text-6xl font-bold", getScoreColor(result.score))}>
                                        {result.score}
                                    </div>
                                    <div className="absolute -bottom-6 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                        / 100
                                    </div>
                                </div>

                                <div className={cn("text-xl font-semibold", getScoreColor(result.score))}>
                                    {getScoreLabel(result.score)}
                                </div>

                                <div className="text-left bg-muted/30 p-4 rounded-lg text-sm leading-relaxed">
                                    <p className="font-semibold mb-2 flex items-center">
                                        <AlertTriangle className="mr-2 h-4 w-4 text-muted-foreground" /> Analysis:
                                    </p>
                                    {result.analysis}
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center">
                                <Shield className="h-16 w-16 mb-4 opacity-20" />
                                <p>Enter text and click check to see the analysis.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

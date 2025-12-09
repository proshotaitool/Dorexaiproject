'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Copy, Check, User, ExternalLink, AlertCircle, Users, PlaySquare, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getChannelId, type ChannelIdResult } from '@/app/actions/get-channel-id';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';

export default function YouTubeChannelIdFinderClient() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<ChannelIdResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const { toast } = useToast();

    const handleFindId = async () => {
        if (!input.trim()) {
            toast({ title: 'Error', description: 'Please enter a URL or Handle', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setResult(null);
        setCopiedId(false);
        setCopiedLink(false);

        try {
            const data = await getChannelId(input);
            if (data.success) {
                setResult(data);
                toast({ title: 'Success', description: 'Channel details found!' });
            } else {
                setResult(data); // Contains error
                toast({ title: 'Error', description: data.error || 'Failed to find Channel ID', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyId = () => {
        if (result?.channelId) {
            navigator.clipboard.writeText(result.channelId);
            setCopiedId(true);
            toast({ title: 'Copied', description: 'Channel ID copied to clipboard!' });
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyLink = () => {
        if (result?.channelUrl) {
            navigator.clipboard.writeText(result.channelUrl);
            setCopiedLink(true);
            toast({ title: 'Copied', description: 'Channel Link copied to clipboard!' });
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

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
                            <BreadcrumbPage>Channel ID Finder</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Channel ID Finder</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Find the unique ID and detailed stats of any YouTube channel. Supports video URLs, channel URLs, and handles.
                </p>
            </div>

            <Card className="mb-8 max-w-2xl mx-auto">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Enter Video URL, Channel URL, or Handle (@user)..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleFindId()}
                        />
                        <Button onClick={handleFindId} disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Finding...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Find ID
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && result.success && (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                    {/* Channel Header Card */}
                    <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card">
                        {/* Banner */}
                        <div className="h-32 md:h-48 bg-muted w-full relative">
                            {result.bannerUrl ? (
                                <img src={result.bannerUrl} alt="Channel Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                                    No Channel Banner
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="p-6 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 relative z-10">
                            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-background shadow-md shrink-0">
                                {result.avatarUrl ? (
                                    <img src={result.avatarUrl} alt="Channel Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                                        <User className="w-10 h-10" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left mb-2">
                                <h2 className="text-2xl font-bold">{result.channelTitle || 'Unknown Channel'}</h2>
                                {result.channelHandle && (
                                    <p className="text-muted-foreground">@{result.channelHandle}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={result.channelUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Visit Channel
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 pt-0 border-t bg-muted/20">
                            <div className="flex flex-col items-center p-3">
                                <Users className="w-5 h-5 mb-1 text-primary" />
                                <span className="text-xs text-muted-foreground">Subscribers</span>
                                <span className="font-bold">{result.subscriberCount || 'Hidden'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3">
                                <Eye className="w-5 h-5 mb-1 text-green-500" />
                                <span className="text-xs text-muted-foreground">Total Views</span>
                                <span className="font-bold">{result.viewCount || 'Unknown'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3">
                                <PlaySquare className="w-5 h-5 mb-1 text-red-500" />
                                <span className="text-xs text-muted-foreground">Total Videos</span>
                                <span className="font-bold">{result.videoCount || 'Unknown'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3">
                                <Calendar className="w-5 h-5 mb-1 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Joined</span>
                                <span className="font-bold">{result.joinedDate || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    {/* IDs and Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Channel ID</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary/50 border rounded-md px-3 py-2 font-mono text-sm font-semibold overflow-hidden text-ellipsis">
                                        {result.channelId}
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={handleCopyId} className="h-9 w-9 shrink-0">
                                        {copiedId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Channel Link</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary/50 border rounded-md px-3 py-2 font-mono text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                                        {result.channelUrl}
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={handleCopyLink} className="h-9 w-9 shrink-0">
                                        {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            )}

            {result && !result.success && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardContent className="p-6 flex items-center gap-4 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p>{result.error}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Content Section */}
            <div className="max-w-4xl mx-auto space-y-12 mb-16 mt-12">
                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">About YouTube Channel ID Finder</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        The YouTube Channel ID Finder is a simple yet essential tool for creators, developers, and marketers.
                        It allows you to instantly find the unique Channel ID associated with any YouTube channel.
                        This ID is often required for API integrations, third-party analytics tools, and advanced YouTube features that cannot be accessed with just a username or handle.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">How to Use</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">1</div>
                            <h3 className="font-semibold text-xl mb-2">Enter URL</h3>
                            <p className="text-muted-foreground">Paste a YouTube Video URL, Channel URL, or Handle (e.g., @username).</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">2</div>
                            <h3 className="font-semibold text-xl mb-2">Find ID</h3>
                            <p className="text-muted-foreground">Click the "Find ID" button to search for the channel details.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">3</div>
                            <h3 className="font-semibold text-xl mb-2">Copy Results</h3>
                            <p className="text-muted-foreground">Copy the Channel ID, Channel Link, or view other stats like subscriber count.</p>
                        </Card>
                    </div>
                </section>
            </div>

            <RelatedTools tools={tools.filter(t => ['YouTube Monetization Checker', 'YouTube Tag Extractor', 'YouTube Data Viewer'].includes(t.name))} />
        </div>
    );
}

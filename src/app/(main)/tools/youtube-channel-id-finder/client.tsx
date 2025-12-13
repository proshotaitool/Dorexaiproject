'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Copy, Check, User, ExternalLink, AlertCircle, Users, PlaySquare, Eye, Calendar, Zap, Layout, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getChannelId, type ChannelIdResult } from '@/app/actions/get-channel-id';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';

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

    const features = [
        { title: 'Instant Search', description: 'Quickly retrieve Channel IDs using a video URL, channel URL, or handle.', icon: Zap },
        { title: 'Detailed Statistics', description: 'View subscriber count, total views, video count, and join date.', icon: Users },
        { title: 'Profile & Banner', description: 'Preview the channel\'s profile picture and banner image.', icon: Layout },
        { title: 'Direct Links', description: 'Get direct links to the channel and easy-to-copy IDs.', icon: Link2 },
    ];

    const steps = [
        { title: 'Enter YouTube URL', description: 'Paste a YouTube Video URL, Channel URL, or Handle (e.g., @username) into the input box.' },
        { title: 'Click Find ID', description: 'Press the "Find ID" button to search for the channel information.' },
        { title: 'View & Copy Results', description: 'See the Channel ID, statistics, and images. Click the copy button to save the ID or link to your clipboard.' },
    ];

    const faqs = [
        { question: 'What is a YouTube Channel ID?', answer: 'A YouTube Channel ID is a unique unique identifier assigned to every YouTube channel. It usually starts with "UC" and is used by apps and services to identify a specific channel.' },
        { question: 'Why do I need a Channel ID?', answer: 'You might need a Channel ID to use third-party analytics tools, integrate YouTube feeds into your website, or access the YouTube Data API.' },
        { question: 'Is this tool free?', answer: 'Yes, the YouTube Channel ID Finder is completely free to use.' },
    ];

    const relatedTools = ['/tools/youtube-monetization-checker', '/tools/youtube-tag-extractor', '/tools/youtube-data-viewer'];

    return (
        <ToolPageLayout
            title="YouTube Channel ID Finder"
            description="Find the unique ID and detailed stats of any YouTube channel. Supports video URLs, channel URLs, and handles."
            toolName="Channel ID Finder"
            category="Text & AI"
            features={features}
            steps={steps}
            faqs={faqs}
            relatedTools={relatedTools}
            aboutTitle="About YouTube Channel ID Finder"
            aboutDescription="The YouTube Channel ID Finder is a simple yet essential tool for creators, developers, and marketers. It allows you to instantly find the unique Channel ID associated with any YouTube channel. This ID is often required for API integrations, third-party analytics tools, and advanced YouTube features that cannot be accessed with just a username or handle."
        >
            <div className="container max-w-4xl mx-auto space-y-8">
                <Card className="mb-8 max-w-2xl mx-auto border-muted shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                placeholder="Enter Video URL, Channel URL, or Handle (@user)..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 h-12 text-base"
                                onKeyDown={(e) => e.key === 'Enter' && handleFindId()}
                            />
                            <Button onClick={handleFindId} disabled={loading} className="w-full md:w-auto h-12 px-6">
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
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

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
            </div>
        </ToolPageLayout>
    );
}

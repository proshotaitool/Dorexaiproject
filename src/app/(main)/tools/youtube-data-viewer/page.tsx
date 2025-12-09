'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, Check, Copy, MonitorPlay, ThumbsUp, ThumbsDown, MessageSquare, Calendar, Info, DollarSign, ShieldAlert, Clock, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getYoutubeData, type YoutubeData } from '@/app/actions/get-youtube-data';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function YoutubeDataViewerPage() {
    const [url, setUrl] = useState('');
    const [data, setData] = useState<YoutubeData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedTags, setCopiedTags] = useState(false);
    const { toast } = useToast();

    const handleGetData = async () => {
        if (!url.trim()) {
            toast({ title: 'Error', description: 'Please enter a YouTube URL', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setData(null);
        setCopiedTags(false);

        try {
            const result = await getYoutubeData(url);
            if (result.success && result.data) {
                setData(result.data);
                toast({ title: 'Success', description: 'Data fetched successfully!' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to fetch data', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopyTags = () => {
        if (!data || data.tags.length === 0) return;
        const tagsString = data.tags.join(', ');
        navigator.clipboard.writeText(tagsString);
        setCopiedTags(true);
        toast({ title: 'Copied', description: 'Tags copied to clipboard!' });
        setTimeout(() => setCopiedTags(false), 2000);
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
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
                            <BreadcrumbPage>Data Viewer</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Data Viewer</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Get deep insights into any YouTube video. View hidden stats, tags, monetization status, and more.
                </p>
            </div>

            <Card className="mb-8 max-w-3xl mx-auto">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Paste YouTube URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleGetData()}
                        />
                        <Button onClick={handleGetData} disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    View Data
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {data && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Channel Info Banner */}
                    <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg">
                        <div className="h-32 md:h-48 bg-muted w-full relative">
                            {data.channelBanner ? (
                                <img src={data.channelBanner} alt="Channel Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                                    No Channel Banner
                                </div>
                            )}
                        </div>
                        <div className="bg-card/95 backdrop-blur-sm p-6 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 relative z-10">
                            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden bg-background shadow-md">
                                {data.channelLogo ? (
                                    <img src={data.channelLogo} alt="Channel Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                                        {data.channelTitle.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left mb-2">
                                <h2 className="text-2xl font-bold">{data.channelTitle}</h2>
                                <p className="text-muted-foreground text-sm">Channel ID: {data.channelId}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`https://www.youtube.com/channel/${data.channelId}`} target="_blank" rel="noopener noreferrer">
                                        Visit Channel
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Video Overview */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-xl">Video Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <h3 className="text-lg font-semibold leading-tight">{data.title}</h3>
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={data.thumbnails[data.thumbnails.length - 1]?.url}
                                        alt="Video Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                        {formatDuration(data.duration)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                                    <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg">
                                        <MonitorPlay className="w-5 h-5 mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground">Views</span>
                                        <span className="font-bold">{parseInt(data.viewCount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg">
                                        <ThumbsUp className="w-5 h-5 mb-1 text-green-500" />
                                        <span className="text-xs text-muted-foreground">Likes</span>
                                        <span className="font-bold">{data.likeCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg">
                                        <MessageSquare className="w-5 h-5 mb-1 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground">Comments</span>
                                        <span className="font-bold">{data.commentCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg">
                                        <ThumbsDown className="w-5 h-5 mb-1 text-red-500" />
                                        <span className="text-xs text-muted-foreground">Dislikes</span>
                                        <span className="font-bold">{data.dislikeCount || 'Hidden'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata & Stats */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Metadata</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" /> Published
                                        </div>
                                        <span className="font-medium text-sm">{data.publishDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Info className="w-4 h-4" /> Category
                                        </div>
                                        <span className="font-medium text-sm">{data.category}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <DollarSign className="w-4 h-4" /> Monetization
                                        </div>
                                        <span className={cn("font-medium text-sm px-2 py-0.5 rounded-full", data.isMonetized ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                            {data.isMonetized ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <ShieldAlert className="w-4 h-4" /> Age Restricted
                                        </div>
                                        <span className={cn("font-medium text-sm px-2 py-0.5 rounded-full", !data.isFamilySafe ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                                            {!data.isFamilySafe ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thumbnails</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {data.thumbnails.map((thumb, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-secondary/50 transition-colors">
                                            <span>{thumb.width}x{thumb.height}</span>
                                            <a href={thumb.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Tags */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Tag className="w-5 h-5" /> Video Tags ({data.tags.length})
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleCopyTags} className="gap-2">
                                {copiedTags ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copiedTags ? 'Copied!' : 'Copy All'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {data.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-full bg-secondary/30 border border-border text-sm font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {data.tags.length === 0 && <span className="text-muted-foreground italic">No tags found.</span>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Channel Tags */}
                    {data.channelTags.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-muted-foreground" /> Channel Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.channelTags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full bg-muted border border-border text-sm font-medium text-muted-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>
            )}
        </div>
    );
}

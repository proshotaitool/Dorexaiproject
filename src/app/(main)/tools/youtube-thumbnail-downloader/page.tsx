'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, ImageIcon, Bookmark, Share2 } from 'lucide-react';
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
import Image from 'next/image';

export default function YoutubeThumbnailDownloaderPage() {
    const [url, setUrl] = useState('');
    const [videoId, setVideoId] = useState<string | null>(null);
    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

    const toolPath = '/tools/youtube-thumbnail-downloader';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    const extractVideoId = (inputUrl: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = inputUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleSearch = () => {
        const id = extractVideoId(url);
        if (id) {
            setVideoId(id);
            toast({ title: 'Video Found', description: 'Thumbnails generated successfully.' });
        } else {
            setVideoId(null);
            toast({ title: 'Invalid URL', description: 'Please enter a valid YouTube video URL.', variant: 'destructive' });
        }
    };

    const handleDownload = async (imageUrl: string, quality: string) => {
        try {
            const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `youtube-thumbnail-${quality}-${videoId}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast({ title: 'Downloaded', description: `${quality} thumbnail downloaded successfully.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to download image.', variant: 'destructive' });
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
            title: 'YouTube Thumbnail Downloader',
            text: 'Download high-quality YouTube thumbnails instantly!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const relatedTools = tools.filter(tool => ['/tools/compress-image', '/tools/resize-image'].includes(tool.path));

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
                            <BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Thumbnail Downloader</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Thumbnail Downloader</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Extract and download high-quality thumbnails from any YouTube video. Supports HD, SD, and more.
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

            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Paste YouTube Video URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} className="w-full md:w-auto">
                            <Search className="mr-2 h-4 w-4" />
                            Get Thumbnails
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {videoId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Max Resolution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Max Resolution (HD)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                <Image
                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                    alt="Max Resolution Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => handleDownload(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, 'HD')}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download HD
                            </Button>
                        </CardContent>
                    </Card>

                    {/* High Quality */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">High Quality (HQ)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                <Image
                                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                    alt="High Quality Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <Button
                                className="w-full"
                                variant="secondary"
                                onClick={() => handleDownload(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, 'HQ')}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download HQ
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Medium Quality */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Medium Quality (MQ)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                <Image
                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                    alt="Medium Quality Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleDownload(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, 'MQ')}
                            >
                                <Download className="mr-2 h-4 w-4" /> Download MQ
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About YouTube Thumbnail Downloader</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our YouTube Thumbnail Downloader is a free online tool that allows you to easily view and download thumbnails from any YouTube video. Whether you need the thumbnail for a project, inspiration, or archival purposes, we provide access to all available qualities, including High Definition (HD), High Quality (HQ), and Medium Quality (MQ).
                            <br /><br />
                            Simply paste the video URL, and we'll instantly extract the thumbnails for you to save. No software installation required!
                        </p>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

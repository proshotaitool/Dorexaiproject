'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Bookmark, Share2, Zap, Image as ImageIcon, Shield, Layers } from 'lucide-react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { UserProfile } from '@/types';
import Image from 'next/image';

export default function YoutubeThumbnailDownloaderClient() {
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


            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;

                // Store details in sessionStorage
                sessionStorage.setItem('return-url', window.location.pathname);
                sessionStorage.setItem('download-url', base64data);
                sessionStorage.setItem('download-filename', `youtube-thumbnail-${quality}-${videoId}.jpg`);

                // Redirect to download page
                window.location.href = '/download';
            };
            reader.readAsDataURL(blob);

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

    const features = [
        { title: 'Multiple Resolutions', description: 'Download thumbnails in HD (1280x720), HQ (480x360), and MQ (320x180).', icon: Layers },
        { title: 'Instant Extraction', description: 'Just paste the URL and get instant access to all available thumbnail sizes.', icon: Zap },
        { title: 'No Watermarks', description: 'Get clean, original thumbnails directly from YouTube servers.', icon: ImageIcon },
        { title: 'Secure & Free', description: 'Free to use with no hidden costs or registration required.', icon: Shield },
    ];

    const steps = [
        { title: 'Copy Video URL', description: 'Go to YouTube and copy the link of the video you want the thumbnail for.' },
        { title: 'Paste URL', description: 'Paste the link into the input box on this page.' },
        { title: 'Download', description: 'Click "Get Thumbnails" and then select the quality you wish to download.' },
    ];

    const faqs = [
        { question: 'Is it legal to download thumbnails?', answer: 'Yes, downloading thumbnails for personal use or reference is generally considered acceptable. However, always respect copyright laws if you plan to reuse them publicly.' },
        { question: 'Why is the HD thumbnail missing?', answer: 'Not all videos have a High Definition (Max Res) thumbnail. This depends on the quality of the uploaded video and whether the creator uploaded a custom thumbnail.' },
        { question: 'Does this tool work for Shorts?', answer: 'Yes, you can paste the URL of a YouTube Short to download its thumbnail.' },
    ];

    const relatedTools = ['/tools/youtube-channel-id-finder', '/tools/youtube-tag-extractor', '/tools/youtube-data-viewer'];

    return (
        <ToolPageLayout
            title="YouTube Thumbnail Downloader"
            description="Extract and download high-quality thumbnails from any YouTube video. Supports HD, SD, and more."
            toolName="Thumbnail Downloader"
            category="Image Tools"
            features={features}
            steps={steps}
            faqs={faqs}
            relatedTools={relatedTools}
            aboutTitle="About YouTube Thumbnail Downloader"
            aboutDescription="Our YouTube Thumbnail Downloader is a free online tool that allows you to easily view and download thumbnails from any YouTube video. Whether you need the thumbnail for a project, inspiration, or archival purposes, we provide access to all available qualities, including High Definition (HD), High Quality (HQ), and Medium Quality (MQ). Simply paste the video URL, and we'll instantly extract the thumbnails for you to save. No software installation required!"
        >
            <div className="container max-w-4xl mx-auto space-y-8">
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

                <Card className="mb-8 border-muted shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                placeholder="Paste YouTube Video URL here..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1 h-12 text-base"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} className="w-full md:w-auto h-12 px-6">
                                <Search className="mr-2 h-4 w-4" />
                                Get Thumbnails
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {videoId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            </div>
        </ToolPageLayout>
    );
}

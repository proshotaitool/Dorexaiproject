'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Search, Check, AlertCircle, DollarSign, Users, PlaySquare, Eye, Calendar, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { checkMonetization, MonetizationResult } from '@/app/actions/check-monetization';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';

export default function YouTubeMonetizationCheckerClient() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<MonetizationResult | null>(null);
    const { toast } = useToast();

    const handleCheck = async () => {
        if (!input.trim()) {
            toast({
                title: "Error",
                description: "Please enter a valid YouTube URL or Handle.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const data = await checkMonetization(input);
            if (data.success) {
                setResult(data);
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to check monetization status.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Breadcrumb */}
            <div className="mb-8">
                <Breadcrumb>
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
                            <BreadcrumbPage>YouTube Monetization Checker</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600">
                    YouTube Monetization Checker
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Check if a YouTube channel is monetized and view detailed channel statistics.
                </p>
            </div>

            {/* Input Section */}
            <Card className="p-6 mb-8 border-muted/40 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Enter Video URL, Channel URL, or Handle (e.g., @username)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="pl-10 h-12 text-base"
                            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                        />
                    </div>
                    <Button
                        onClick={handleCheck}
                        disabled={loading}
                        className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Check Status
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Result Section */}
            {result && result.channelDetails && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Status Card */}
                    <Card className={`p-6 border-l-4 ${result.isMonetized ? 'border-l-green-500 bg-green-500/5' : 'border-l-red-500 bg-red-500/5'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${result.isMonetized ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {result.isMonetized ? <Check className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold mb-1 ${result.isMonetized ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.isMonetized ? 'Channel is Monetized' : 'Channel is Not Monetized'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {result.reason}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Channel Details Card */}
                    <Card className="overflow-hidden border-muted/40 shadow-md">
                        {/* Banner */}
                        <div className="h-32 md:h-48 bg-muted relative w-full">
                            {result.channelDetails.bannerUrl ? (
                                <Image
                                    src={result.channelDetails.bannerUrl}
                                    alt="Channel Banner"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                                    No Channel Banner
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6 relative">
                            {/* Avatar & Title */}
                            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-8 relative z-10">
                                <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background bg-background shadow-lg overflow-hidden shrink-0">
                                    {result.channelDetails.avatarUrl ? (
                                        <Image
                                            src={result.channelDetails.avatarUrl}
                                            alt="Channel Logo"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                            <Users className="h-10 w-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-2 md:pt-0 md:pb-2 w-full">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold truncate">{result.channelDetails.title}</h2>
                                            <a
                                                href={result.channelDetails.channelUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                                            >
                                                Visit Channel <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-muted/30 border border-muted/40 flex flex-col items-center text-center hover:bg-muted/50 transition-colors">
                                    <Users className="h-5 w-5 text-blue-500 mb-2" />
                                    <span className="text-sm text-muted-foreground">Subscribers</span>
                                    <span className="text-lg font-bold">{result.channelDetails.subscriberCount || 'Hidden'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/30 border border-muted/40 flex flex-col items-center text-center hover:bg-muted/50 transition-colors">
                                    <Eye className="h-5 w-5 text-green-500 mb-2" />
                                    <span className="text-sm text-muted-foreground">Total Views</span>
                                    <span className="text-lg font-bold">{result.channelDetails.viewCount || 'Unknown'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/30 border border-muted/40 flex flex-col items-center text-center hover:bg-muted/50 transition-colors">
                                    <PlaySquare className="h-5 w-5 text-red-500 mb-2" />
                                    <span className="text-sm text-muted-foreground">Total Videos</span>
                                    <span className="text-lg font-bold">{result.channelDetails.videoCount || 'Unknown'}</span>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/30 border border-muted/40 flex flex-col items-center text-center hover:bg-muted/50 transition-colors">
                                    <Calendar className="h-5 w-5 text-orange-500 mb-2" />
                                    <span className="text-sm text-muted-foreground">Joined</span>
                                    <span className="text-lg font-bold">{result.channelDetails.joinedDate || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Content Section */}
            <div className="max-w-4xl mx-auto space-y-12 mb-16 mt-12">
                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">About YouTube Monetization Checker</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        The YouTube Monetization Checker is a powerful tool designed for creators and marketers to instantly verify if a YouTube channel is monetized.
                        It analyzes public channel data to determine if ads are being served and if the channel is part of the YouTube Partner Program (YPP).
                        Gain insights into potential revenue streams and competitor strategies with just a click.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">How to Use</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">1</div>
                            <h3 className="font-semibold text-xl mb-2">Enter URL</h3>
                            <p className="text-muted-foreground">Paste a YouTube Video URL, Channel URL, or Handle.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">2</div>
                            <h3 className="font-semibold text-xl mb-2">Check Status</h3>
                            <p className="text-muted-foreground">Click the "Check Status" button to analyze the channel.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">3</div>
                            <h3 className="font-semibold text-xl mb-2">View Results</h3>
                            <p className="text-muted-foreground">See if the channel is monetized and view detailed statistics.</p>
                        </Card>
                    </div>
                </section>
            </div>

            <RelatedTools tools={tools.filter(t => ['YouTube Channel ID Finder', 'YouTube Earning Calculator', 'YouTube Tag Generator'].includes(t.name))} />
        </div>
    );
}

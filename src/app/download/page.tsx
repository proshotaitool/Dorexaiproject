'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, ArrowLeft, ShieldCheck, Lock, Share2, Crop, Image as ImageIcon, FileImage, Minimize2, FileText, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { AdsterraAds } from '@/components/ads/AdsterraAds';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

export default function DownloadPage() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(5);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const hasDownloaded = useRef(false);

    useEffect(() => {
        const storedUrl = sessionStorage.getItem('download-url') || sessionStorage.getItem('download-image');
        if (!storedUrl) {
            router.replace('/'); // Redirect home if no file found
            return;
        }
        setDownloadUrl(storedUrl);
    }, [router]);

    useEffect(() => {
        if (!downloadUrl || hasDownloaded.current) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleDownload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [downloadUrl]);

    const handleDownload = async () => {
        if (!downloadUrl || hasDownloaded.current) return;

        setIsDownloading(true);
        hasDownloaded.current = true;

        try {
            // Convert Data URL to Blob
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            const filename = sessionStorage.getItem('download-filename') || 'dorex-ai-file';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error("Download failed:", error);
            hasDownloaded.current = false; // Reset on error to allow retry
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 container max-w-[1600px] mx-auto py-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

                    {/* Left Sidebar Ad */}
                    <aside className="hidden lg:block w-[160px] flex-shrink-0 sticky top-24">
                        <div className="flex flex-col gap-4">
                            <span className="text-xs text-muted-foreground text-center w-full block">Advertisement</span>
                            <AdsterraAds type="banner_160x600" />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 w-full max-w-4xl flex flex-col items-center space-y-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground">
                            Thanks For Downloading!
                        </h1>

                        {/* Top Banner Ad */}
                        <div className="w-full flex justify-center">
                            <AdsterraAds type="banner_468x60" />
                        </div>

                        <Card className="w-full max-w-md text-center shadow-lg border-2 border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-2xl">Your Download is Ready!</CardTitle>
                                <CardDescription>
                                    Your file will start downloading automatically in {timeLeft} seconds.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
                                        {timeLeft > 0 ? (
                                            <span className="text-4xl font-bold text-primary">{timeLeft}</span>
                                        ) : (
                                            <Download className="w-10 h-10 text-primary animate-bounce" />
                                        )}
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                className="text-muted stroke-current"
                                                strokeWidth="8"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                            />
                                            <circle
                                                className="text-primary stroke-current transition-all duration-1000 ease-linear"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                                strokeDasharray="251.2"
                                                strokeDashoffset={251.2 - (251.2 * (5 - timeLeft)) / 5}
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        If the download doesn't start automatically, click the button below.
                                    </p>
                                    <Button onClick={handleDownload} disabled={isDownloading || !downloadUrl} className="w-full">
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-4 w-4" /> Download Now
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <Button variant="ghost" onClick={() => {
                                    const returnUrl = sessionStorage.getItem('return-url');
                                    if (returnUrl) {
                                        router.push(returnUrl);
                                    } else {
                                        router.back();
                                    }
                                }} className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Editor
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Continue To... Section */}
                        <Card className="w-full max-w-4xl shadow-md border-primary/5">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">Continue to...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/resize-image')}>
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Minimize2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Resize IMAGE</span>
                                        </div>
                                    </Button>

                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/crop-image')}>
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                            <Crop className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Crop IMAGE</span>
                                        </div>
                                    </Button>

                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/convert-to-jpg')}>
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                            <FileImage className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Convert to JPG</span>
                                        </div>
                                    </Button>

                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/compress-image')}>
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                            <Minimize2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Compress IMAGE</span>
                                        </div>
                                    </Button>

                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/watermark-image')}>
                                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Watermark IMAGE</span>
                                        </div>
                                    </Button>

                                    <Button variant="outline" className="h-auto py-4 justify-start space-x-4 bg-background hover:bg-muted/50" onClick={() => router.push('/tools/rotate-image')}>
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold">Rotate IMAGE</span>
                                        </div>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Spread the Word Section */}
                        <div className="text-center space-y-6 py-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-foreground">How can you thank us? Spread the word!</h3>
                                <p className="text-muted-foreground">Please share the tool to inspire more productive people!</p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                <Button variant="outline" className="gap-2" onClick={() => window.open('https://twitter.com/intent/tweet?text=Check%20out%20DoreX%20Ai%20-%20The%20Ultimate%20Online%20Tool%20Suite!%20https://dorexai.space', '_blank')}>
                                    <Twitter className="w-4 h-4 text-sky-500" />
                                    <span>Twitter</span>
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={() => window.open('https://www.facebook.com/sharer/sharer.php?u=https://dorexai.space', '_blank')}>
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    <span>Facebook</span>
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={() => window.open('https://www.linkedin.com/sharing/share-offsite/?url=https://dorexai.space', '_blank')}>
                                    <Linkedin className="w-4 h-4 text-blue-700" />
                                    <span>LinkedIn</span>
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={() => window.open('https://www.instagram.com/', '_blank')}>
                                    <Instagram className="w-4 h-4 text-pink-600" />
                                    <span>Instagram</span>
                                </Button>
                            </div>
                        </div>

                        {/* Middle Native/Banner Ad */}
                        <div className="w-full max-w-2xl flex justify-center">
                            <AdsterraAds type="banner_300x250" />
                        </div>

                        {/* Bottom Banner Ad */}
                        <div className="w-full flex justify-center">
                            <AdsterraAds type="banner_300x250" />
                        </div>
                    </main>

                    {/* Right Sidebar Ad */}
                    <aside className="hidden lg:block w-[160px] flex-shrink-0 sticky top-24">
                        <div className="flex flex-col gap-4">
                            <span className="text-xs text-muted-foreground text-center w-full block">Advertisement</span>
                            {/* Using Native Banner here to avoid ID conflict with Left Sidebar's 160x600 */}
                            <AdsterraAds type="native_banner" />
                        </div>
                    </aside>
                </div>
            </div>

            {/* Trusted Section */}
            <section className="w-full py-12 bg-background text-center">
                <div className="container max-w-4xl mx-auto px-4 space-y-6">
                    <div className="space-y-3">
                        <h2 className="text-lg md:text-xl font-semibold text-foreground">
                            Your trusted online Document Editor, loved by users worldwide
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                            DoreX Ai is your simple solution for editing documents online. Access all the tools
                            you need to enhance your documents easily, straight from the web, with 100%
                            security.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12 pt-2">
                        <div className="flex items-center gap-2 text-muted-foreground/80 hover:text-primary transition-colors">
                            <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
                            <span className="font-medium text-base">ISO 27001 Certified</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground/80 hover:text-primary transition-colors">
                            <Lock className="w-8 h-8 stroke-[1.5]" />
                            <span className="font-medium text-base">Secure 256-bit SSL Encryption</span>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            {/* Social Bar (Sticky) */}
            <AdsterraAds type="social_bar" />
        </div>
    );
}

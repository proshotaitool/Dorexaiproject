'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, ArrowLeft } from 'lucide-react';

export default function DownloadPage() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(5);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const hasDownloaded = useRef(false);

    useEffect(() => {
        const storedImage = sessionStorage.getItem('download-image');
        if (!storedImage) {
            router.replace('/'); // Redirect home if no image found
            return;
        }
        setDownloadUrl(storedImage);
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

    const handleDownload = () => {
        if (!downloadUrl) return;

        setIsDownloading(true);
        hasDownloaded.current = true;

        try {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'dorex-ai-edited.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Your Download is Ready!</CardTitle>
                    <CardDescription>
                        Your edited image will start downloading automatically in {timeLeft} seconds.
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

                    <Button variant="ghost" onClick={() => router.back()} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Editor
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Copy, Download, Loader2 } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getYoutubeTranscript } from '@/app/actions/get-youtube-transcript';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function YoutubeTranscriptExtractorPage() {
    const [url, setUrl] = useState('');
    const [transcript, setTranscript] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [includeTimestamps, setIncludeTimestamps] = useState(false);
    const { toast } = useToast();

    const handleExtract = async () => {
        if (!url) {
            toast({ title: 'Error', description: 'Please enter a YouTube URL', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setTranscript(null);

        try {
            const result = await getYoutubeTranscript(url);
            if (result.success && result.data) {
                setTranscript(result.data);
                toast({ title: 'Success', description: 'Transcript extracted successfully' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to extract transcript', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const formatTranscript = () => {
        if (!transcript) return '';
        return transcript.map(item => {
            if (includeTimestamps) {
                const minutes = Math.floor(item.start / 60);
                const seconds = Math.floor(item.start % 60);
                const timestamp = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
                return `${timestamp} ${item.text}`;
            }
            return item.text;
        }).join(' ');
    };

    const handleCopy = () => {
        const text = formatTranscript();
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: 'Transcript copied to clipboard' });
    };

    const handleDownload = () => {
        const text = formatTranscript();
        const blob = new Blob([text], { type: 'text/plain' });

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;

            // Store details in sessionStorage
            sessionStorage.setItem('return-url', window.location.pathname);
            sessionStorage.setItem('download-url', base64data);
            sessionStorage.setItem('download-filename', 'transcript.txt');

            // Redirect to download page
            window.location.href = '/download';
        };
        reader.readAsDataURL(blob);
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
                            <BreadcrumbLink href="/tools/content">Content Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Transcript Extractor</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Transcript Extractor</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Extract text and captions from YouTube videos instantly. Perfect for creating summaries, blog posts, or study notes.
                </p>
            </div>

            <Card className="mb-8 max-w-3xl mx-auto">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Paste YouTube Video URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                        />
                        <Button onClick={handleExtract} disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                            Extract Transcript
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {transcript && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Transcript</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="timestamps"
                                    checked={includeTimestamps}
                                    onCheckedChange={setIncludeTimestamps}
                                />
                                <Label htmlFor="timestamps">Timestamps</Label>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formatTranscript()}
                                readOnly
                                className="min-h-[400px] font-mono text-sm"
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={handleCopy}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy
                                </Button>
                                <Button onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" /> Download .txt
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

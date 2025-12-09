'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { OutOfCreditsDialog } from '@/components/out-of-credits-dialog';
import { deductCredit } from '@/lib/credits';
import { compressPdf } from '@/app/actions/compress-pdf';
import { Slider } from '@/components/ui/slider';

export default function CompressPdfPage() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [quality, setQuality] = useState<number>(70); // Default 70%

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    interface UserProfile {
        favoriteTools?: string[];
    }
    const { data: userProfile } = useDoc(userDocRef) as { data: UserProfile | undefined };

    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);

    const toolPath = '/tools/compress-pdf';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

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
            title: 'Compress PDF',
            text: 'Check out this Compress PDF tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const handleFile = (incomingFile: File) => {
        if (incomingFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please upload a valid PDF file.', variant: 'destructive' });
            return;
        }
        setFile(incomingFile);
        setOriginalSize(incomingFile.size);
        setCompressedPdfUrl(null);
        setCompressedSize(0);
        setQuality(70);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        handleDragLeave(e);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFile(droppedFile);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFile(selectedFile);
        if (e.target) e.target.value = '';
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleCompress = async () => {
        if (!file) return;

        setIsLoading(true);
        // Keep existing URL to avoid flicker if re-compressing, or clear it?
        // Clearing it gives better feedback that something is happening.
        setCompressedPdfUrl(null);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('quality', (quality / 100).toString());

            const resultUrl = await compressPdf(formData);
            setCompressedPdfUrl(resultUrl);

            // Calculate compressed size from base64 string
            const base64Data = resultUrl.split(',')[1];
            const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
            setCompressedSize(sizeInBytes);

            toast({
                title: 'Compression Successful',
                description: `PDF compressed with ${quality}% quality.`,
            });

        } catch (error) {
            console.error("Compression Error:", error);
            toast({ title: 'Error', description: 'Could not compress PDF.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!compressedPdfUrl) return;
        const link = document.createElement('a');
        link.href = compressedPdfUrl;
        link.download = `compressed-${file?.name || 'document.pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setCompressedPdfUrl(null);
        setOriginalSize(0);
        setCompressedSize(0);
        setQuality(70);
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const calculateReduction = () => {
        if (originalSize === 0 || compressedSize === 0) return 0;
        return Math.round(((originalSize - compressedSize) / originalSize) * 100);
    };

    const relatedTools = tools.filter(tool => ['/tools/pdf-to-word', '/tools/jpg-to-pdf'].includes(tool.path));

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
                            <BreadcrumbLink href="/tools/pdf">PDF Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Compress PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Compress PDF</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Reduce the file size of your PDF documents while maintaining quality.
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
            <Card
                className={cn('max-w-5xl mx-auto transition-colors', isDragging && 'bg-primary/10')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="p-4 md:p-6 text-center">
                    {!file ? (
                        <div className="border-2 border-dashed rounded-xl p-8 md:p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                            <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-base md:text-lg font-semibold">Drag and drop your PDF here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none">
                                <Upload className="mr-2 h-4 w-4" />
                                Select PDF
                            </Button>
                        </div>
                    ) : (
                        <div className="text-left">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">Original Size: {formatSize(originalSize)}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleReset} className="self-end md:self-auto">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                                {/* Original Preview */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-center">Original</h4>
                                    <div className="border rounded-lg overflow-hidden h-[300px] md:h-[500px] bg-muted/10">
                                        <iframe
                                            src={URL.createObjectURL(file)}
                                            className="w-full h-full"
                                            title="Original PDF"
                                        />
                                    </div>
                                </div>

                                {/* Compressed Preview */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-center">Compressed</h4>
                                    {compressedPdfUrl ? (
                                        <div className="border rounded-lg overflow-hidden h-[300px] md:h-[500px] bg-muted/10 relative">
                                            <iframe
                                                src={compressedPdfUrl}
                                                className="w-full h-full"
                                                title="Compressed PDF"
                                            />
                                            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                                -{calculateReduction()}%
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg h-[300px] md:h-[500px] bg-muted/10 flex flex-col items-center justify-center text-muted-foreground">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-10 w-10 animate-spin mb-4" />
                                                    <p>Compressing...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRight className="h-10 w-10 mb-4 opacity-50" />
                                                    <p>Click Compress to see result</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {compressedPdfUrl && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center space-y-4">
                                    <div>
                                        <p className="text-green-800 font-medium">
                                            Compression Complete!
                                        </p>
                                        <p className="text-green-700 text-sm mt-1">
                                            Reduced from <span className="font-bold">{formatSize(originalSize)}</span> to <span className="font-bold">{formatSize(compressedSize)}</span>
                                        </p>
                                    </div>

                                    <div className="max-w-md mx-auto pt-2 border-t border-green-200">
                                        <label className="text-sm font-medium text-green-800 mb-2 block">Compression Quality: {quality}%</label>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                value={[quality]}
                                                onValueChange={(vals) => setQuality(vals[0])}
                                                max={100}
                                                min={10}
                                                step={10}
                                                className="flex-1"
                                            />
                                            <Button size="sm" onClick={handleCompress} disabled={isLoading}>
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">Lower quality = smaller file size</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                {!compressedPdfUrl ? (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleCompress} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                        {isLoading ? 'Compressing...' : 'Compress PDF'}
                                    </Button>
                                ) : (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleDownload}>
                                        <Download className="mr-2 h-5 w-5" />
                                        Download Compressed PDF
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">Start Over</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About PDF Compression</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our PDF Compressor reduces the file size of your documents by optimizing images and internal structures. This is perfect for emailing large files, uploading to websites with size limits, or saving storage space.
                            <br /><br />
                            We use a "Strong Compression" method that rasterizes pages into optimized images. This ensures significant size reduction, especially for documents with many high-resolution images or complex vector graphics.
                        </p>
                    </CardContent>
                </Card>
            </section>
            <RelatedTools tools={relatedTools} />
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="application/pdf" />
            <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
        </div>
    );
}

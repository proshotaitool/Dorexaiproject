'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, Scissors, CheckCircle } from 'lucide-react';
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
import { PDFDocument } from 'pdf-lib';

// CDN for PDF.js
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageData {
    index: number;
    thumbnail: string;
    selected: boolean;
}

export default function SplitPdfClient() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const toolPath = '/tools/split-pdf';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    // Load PDF.js script
    useEffect(() => {
        if (document.querySelector(`script[src="${PDFJS_CDN}"]`)) return;
        const script = document.createElement('script');
        script.src = PDFJS_CDN;
        script.async = true;
        document.body.appendChild(script);
    }, []);

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
            title: 'Split PDF',
            text: 'Check out this Split PDF tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const loadPdfPages = async (pdfFile: File) => {
        setIsLoading(true);
        setSplitPdfUrl(null);
        try {
            // @ts-ignore
            if (!window.pdfjsLib) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                // @ts-ignore
                if (!window.pdfjsLib) throw new Error('PDF.js library not loaded yet.');
            }
            // @ts-ignore
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            const arrayBuffer = await pdfFile.arrayBuffer();
            // @ts-ignore
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const newPages: PageData[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                newPages.push({
                    index: i - 1, // 0-based index
                    thumbnail: canvas.toDataURL(),
                    selected: false
                });
            }

            setPages(newPages);
            setFile(pdfFile);

        } catch (error: any) {
            console.error("Error loading PDF:", error);
            toast({ title: 'Error', description: error.message || 'Could not load PDF pages.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFile = (incomingFile: File) => {
        if (incomingFile.type !== 'application/pdf') {
            toast({ title: 'Invalid File', description: 'Please upload a valid PDF file.', variant: 'destructive' });
            return;
        }
        loadPdfPages(incomingFile);
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

    const togglePageSelection = (index: number) => {
        setPages(prev => prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p));
        setSplitPdfUrl(null);
    };

    const selectAll = () => {
        setPages(prev => prev.map(p => ({ ...p, selected: true })));
        setSplitPdfUrl(null);
    };

    const deselectAll = () => {
        setPages(prev => prev.map(p => ({ ...p, selected: false })));
        setSplitPdfUrl(null);
    };

    const handleSplit = async () => {
        const selectedIndices = pages.filter(p => p.selected).map(p => p.index);

        if (selectedIndices.length === 0) {
            toast({ title: 'No pages selected', description: 'Please select at least one page to extract.', variant: 'destructive' });
            return;
        }

        setIsSplitting(true);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const arrayBuffer = await file!.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdfDoc = await PDFDocument.create();

            const copiedPages = await newPdfDoc.copyPages(pdfDoc, selectedIndices);
            copiedPages.forEach((page) => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setSplitPdfUrl(url);

            toast({
                title: 'Success',
                description: 'Selected pages extracted successfully! Click Download to save.',
            });

        } catch (error) {
            console.error("Error splitting PDF:", error);
            toast({ title: 'Error', description: 'Could not split PDF.', variant: 'destructive' });
        } finally {
            setIsSplitting(false);
        }
    };

    const handleDownload = () => {
        if (!splitPdfUrl || !file) return;
        const link = document.createElement('a');
        link.href = splitPdfUrl;
        link.download = `split-${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setPages([]);
        setSplitPdfUrl(null);
    };

    const relatedTools = tools.filter(tool => ['/tools/merge-pdf', '/tools/organize-pdf-tool'].includes(tool.path));

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
                            <BreadcrumbPage>Split PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Split PDF</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Extract pages from your PDF files. Select the pages you want to keep.
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
                className={cn('max-w-6xl mx-auto transition-colors', isDragging && 'bg-primary/10')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="p-4 md:p-6 text-center">
                    {!file ? (
                        <div className="border-2 border-dashed rounded-xl p-8 md:p-12 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleUploadClick}>
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
                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg sticky top-4 z-10 backdrop-blur-sm gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">{pages.length} Pages</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end">
                                    <Button variant="secondary" onClick={handleReset} size="sm">
                                        <X className="h-4 w-4 mr-2" /> Reset
                                    </Button>
                                    {!splitPdfUrl ? (
                                        <Button onClick={handleSplit} disabled={isSplitting} size="sm">
                                            {isSplitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scissors className="h-4 w-4 mr-2" />}
                                            Extract Selected
                                        </Button>
                                    ) : (
                                        <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground">Loading pages...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-end gap-2 mb-4">
                                        <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                                        <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-2 md:p-4 bg-muted/10 rounded-xl min-h-[400px]">
                                        {pages.map((page, index) => (
                                            <div
                                                key={index}
                                                onClick={() => togglePageSelection(index)}
                                                className={cn(
                                                    "relative group bg-background rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:border-primary/50",
                                                    page.selected && "border-primary ring-2 ring-primary/20"
                                                )}
                                            >
                                                <div className="aspect-[3/4] p-2 overflow-hidden relative">
                                                    <img
                                                        src={page.thumbnail}
                                                        alt={`Page ${index + 1}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                        {index + 1}
                                                    </div>
                                                    {page.selected && (
                                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Split PDF</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong>Upload:</strong> Select or drag and drop your PDF file.</li>
                            <li><strong>Select:</strong> Click on the pages you want to keep.</li>
                            <li><strong>Extract:</strong> Click "Extract Selected" to create a new PDF with only those pages.</li>
                            <li><strong>Download:</strong> Save your new PDF file.</li>
                        </ul>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="application/pdf" />
            <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
        </div>
    );
}

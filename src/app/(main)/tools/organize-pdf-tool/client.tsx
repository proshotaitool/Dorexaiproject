'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, RotateCw, RotateCcw, Trash2, Save, ArrowUp, ArrowDown, Move, Layers } from 'lucide-react';
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
import { PDFDocument, degrees } from 'pdf-lib';

// We'll use the CDN for PDF.js to avoid complex build config
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PageData {
    originalIndex: number;
    rotation: number;
    thumbnail: string;
    id: string; // Unique ID for React keys
}

export default function OrganizePdfClient() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [organizedPdfUrl, setOrganizedPdfUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

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

    const toolPath = '/tools/organize-pdf-tool';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    // Load PDF.js script
    useEffect(() => {
        if (document.querySelector(`script[src="${PDFJS_CDN}"]`)) return;
        const script = document.createElement('script');
        script.src = PDFJS_CDN;
        script.async = true;
        document.body.appendChild(script);
        return () => {
            // Optional: remove script on unmount, but usually better to keep it
        };
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
            title: 'Organize PDF',
            text: 'Check out this Organize PDF tool!',
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
        setOrganizedPdfUrl(null);
        try {
            // @ts-ignore
            if (!window.pdfjsLib) {
                // Retry once after a short delay if script just loaded
                await new Promise(resolve => setTimeout(resolve, 1000));
                // @ts-ignore
                if (!window.pdfjsLib) throw new Error('PDF.js library not loaded yet. Please try again.');
            }
            // @ts-ignore
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            const arrayBuffer = await pdfFile.arrayBuffer();
            // @ts-ignore
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const newPages: PageData[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 }); // Thumbnail scale
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                newPages.push({
                    originalIndex: i - 1, // 0-based index for pdf-lib
                    rotation: 0,
                    thumbnail: canvas.toDataURL(),
                    id: Math.random().toString(36).substr(2, 9)
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

    // Page Manipulation Functions
    const rotatePage = (index: number, direction: 'cw' | 'ccw') => {
        setPages(prev => prev.map((p, i) => {
            if (i !== index) return p;
            const delta = direction === 'cw' ? 90 : -90;
            return { ...p, rotation: (p.rotation + delta) % 360 };
        }));
        setOrganizedPdfUrl(null); // Reset organized state on change
    };

    const deletePage = (index: number) => {
        setPages(prev => prev.filter((_, i) => i !== index));
        setOrganizedPdfUrl(null); // Reset organized state on change
    };

    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return;
        setPages(prev => {
            const newPages = [...prev];
            const [movedItem] = newPages.splice(fromIndex, 1);
            newPages.splice(toIndex, 0, movedItem);
            return newPages;
        });
        setOrganizedPdfUrl(null); // Reset organized state on change
    };

    // Drag and Drop Reordering
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverItem = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        movePage(draggedItemIndex, index);
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    const handleOrganize = async () => {
        if (!file || pages.length === 0) return;
        setIsOrganizing(true);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdfDoc = await PDFDocument.create();

            // Copy pages in the new order
            const originalIndices = pages.map(p => p.originalIndex);
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, originalIndices);

            pages.forEach((pageData, i) => {
                const page = copiedPages[i];
                const rotation = page.getRotation();
                const newRotation = rotation.angle + pageData.rotation;
                page.setRotation(degrees(newRotation));
                newPdfDoc.addPage(page);
            });

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setOrganizedPdfUrl(url);

            toast({
                title: 'Success',
                description: 'PDF organized successfully! Click Download to save.',
            });

        } catch (error) {
            console.error("Error organizing PDF:", error);
            toast({ title: 'Error', description: 'Could not organize PDF.', variant: 'destructive' });
        } finally {
            setIsOrganizing(false);
        }
    };

    const handleDownload = () => {
        if (!organizedPdfUrl || !file) return;
        const link = document.createElement('a');
        link.href = organizedPdfUrl;
        link.download = `organized-${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setFile(null);
        setPages([]);
        setOrganizedPdfUrl(null);
    };

    const relatedTools = tools.filter(tool => ['/tools/compress-pdf', '/tools/jpg-to-pdf'].includes(tool.path));

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
                            <BreadcrumbPage>Organize PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Organize PDF</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Reorder, rotate, and remove pages from your PDF documents.
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
                                    {!organizedPdfUrl ? (
                                        <Button onClick={handleOrganize} disabled={isOrganizing} size="sm">
                                            {isOrganizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
                                            Organize PDF
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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-2 md:p-4 bg-muted/10 rounded-xl min-h-[400px]">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOverItem(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                                "relative group bg-background rounded-lg shadow-sm border-2 transition-all cursor-move hover:border-primary/50",
                                                draggedItemIndex === index && "opacity-50 border-dashed border-primary"
                                            )}
                                        >
                                            <div className="aspect-[3/4] p-2 overflow-hidden relative">
                                                <img
                                                    src={page.thumbnail}
                                                    alt={`Page ${index + 1}`}
                                                    className="w-full h-full object-contain transition-transform duration-300"
                                                    style={{ transform: `rotate(${page.rotation}deg)` }}
                                                />
                                                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                    {index + 1}
                                                </div>
                                            </div>

                                            {/* Hover Controls */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() => rotatePage(index, 'ccw')}
                                                        title="Rotate Left"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={() => rotatePage(index, 'cw')}
                                                        title="Rotate Right"
                                                    >
                                                        <RotateCw className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    onClick={() => deletePage(index)}
                                                    title="Delete Page"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Organize PDF</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong>Reorder:</strong> Drag and drop pages to change their order.</li>
                            <li><strong>Rotate:</strong> Hover over a page and use the rotate buttons to fix orientation.</li>
                            <li><strong>Delete:</strong> Click the trash icon to remove unwanted pages.</li>
                            <li><strong>Save:</strong> Click "Organize PDF" then "Download PDF" to save your changes.</li>
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

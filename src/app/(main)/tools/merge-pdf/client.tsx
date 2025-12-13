'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, Merge, Move, Trash2 } from 'lucide-react';
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

interface PdfFile {
    id: string;
    file: File;
    thumbnail: string;
    pageCount: number;
}

export default function MergePdfClient() {
    const { toast } = useToast();
    const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
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

    const toolPath = '/tools/merge-pdf';
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
            title: 'Merge PDF',
            text: 'Check out this Merge PDF tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const generateThumbnail = async (file: File): Promise<{ thumbnail: string, pageCount: number }> => {
        // @ts-ignore
        if (!window.pdfjsLib) {
            // @ts-ignore
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        }

        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        return {
            thumbnail: canvas.toDataURL(),
            pageCount: pdf.numPages
        };
    };

    const handleFiles = async (incomingFiles: File[]) => {
        const validFiles = incomingFiles.filter(f => f.type === 'application/pdf');
        if (validFiles.length === 0) {
            toast({ title: 'Invalid Files', description: 'Please upload valid PDF files.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setMergedPdfUrl(null);

        try {
            // @ts-ignore
            if (!window.pdfjsLib) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                // @ts-ignore
                if (!window.pdfjsLib) throw new Error('PDF.js library not loaded yet.');
            }
            // @ts-ignore
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

            const newPdfFiles: PdfFile[] = [];
            for (const file of validFiles) {
                const { thumbnail, pageCount } = await generateThumbnail(file);
                newPdfFiles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    thumbnail,
                    pageCount
                });
            }

            setPdfFiles(prev => [...prev, ...newPdfFiles]);

        } catch (error: any) {
            console.error("Error loading PDFs:", error);
            toast({ title: 'Error', description: 'Could not load PDF files.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
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
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) handleFiles(droppedFiles);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        if (selectedFiles.length > 0) handleFiles(selectedFiles);
        if (e.target) e.target.value = '';
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const removeFile = (id: string) => {
        setPdfFiles(prev => prev.filter(f => f.id !== id));
        setMergedPdfUrl(null);
    };

    const moveFile = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pdfFiles.length) return;
        setPdfFiles(prev => {
            const newFiles = [...prev];
            const [movedItem] = newFiles.splice(fromIndex, 1);
            newFiles.splice(toIndex, 0, movedItem);
            return newFiles;
        });
        setMergedPdfUrl(null);
    };

    // Drag and Drop Reordering
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverItem = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;
        moveFile(draggedItemIndex, index);
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
    };

    const handleMerge = async () => {
        if (pdfFiles.length < 2) {
            toast({ title: 'Not enough files', description: 'Please upload at least 2 PDF files to merge.', variant: 'destructive' });
            return;
        }

        setIsMerging(true);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of pdfFiles) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setMergedPdfUrl(url);

            toast({
                title: 'Success',
                description: 'PDFs merged successfully! Click Download to save.',
            });

        } catch (error) {
            console.error("Error merging PDFs:", error);
            toast({ title: 'Error', description: 'Could not merge PDFs.', variant: 'destructive' });
        } finally {
            setIsMerging(false);
        }
    };

    const handleDownload = async () => {
        if (!mergedPdfUrl) return;

        try {
            // Convert Blob URL to Base64 Data URL to persist across navigation
            const response = await fetch(mergedPdfUrl);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;

                // Store details in sessionStorage
                sessionStorage.setItem('return-url', window.location.pathname);
                sessionStorage.setItem('download-url', base64data);
                sessionStorage.setItem('download-filename', 'merged-document.pdf');

                // Redirect to download page
                window.location.href = '/download';
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error("Download preparation failed", e);
            toast({ title: "Error", description: "Could not prepare download", variant: "destructive" });
        }
    };

    const handleReset = () => {
        setPdfFiles([]);
        setMergedPdfUrl(null);
    };

    const relatedTools = tools.filter(tool => ['/tools/organize-pdf-tool', '/tools/compress-pdf'].includes(tool.path));

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
                            <BreadcrumbPage>Merge PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Merge PDF</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Combine multiple PDF files into one single document. Drag and drop to reorder.
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
                className={cn('max-w-4xl mx-auto transition-colors', isDragging && 'bg-primary/10')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="p-4 md:p-6 text-center">
                    {pdfFiles.length === 0 ? (
                        <div className="border-2 border-dashed rounded-xl p-8 md:p-12 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleUploadClick}>
                            <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-base md:text-lg font-semibold">Drag and drop PDFs here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none">
                                <Upload className="mr-2 h-4 w-4" />
                                Select PDF Files
                            </Button>
                        </div>
                    ) : (
                        <div className="text-left">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg sticky top-4 z-10 backdrop-blur-sm gap-4">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <Merge className="h-8 w-8 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">{pdfFiles.length} Files Selected</p>
                                        <p className="text-sm text-muted-foreground">Drag to reorder</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto justify-end flex-wrap">
                                    <Button variant="secondary" onClick={handleReset} size="sm">
                                        <X className="h-4 w-4 mr-2" /> Reset
                                    </Button>
                                    <Button variant="outline" onClick={handleUploadClick} size="sm">
                                        <Upload className="h-4 w-4 mr-2" /> Add More
                                    </Button>
                                    {!mergedPdfUrl ? (
                                        <Button onClick={handleMerge} disabled={isMerging || pdfFiles.length < 2} size="sm">
                                            {isMerging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Merge className="h-4 w-4 mr-2" />}
                                            Merge PDF
                                        </Button>
                                    ) : (
                                        <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download Merged
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                    <p className="text-muted-foreground">Processing files...</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {pdfFiles.map((pdf, index) => (
                                    <div
                                        key={pdf.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOverItem(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "flex items-center gap-4 p-3 md:p-4 bg-background border rounded-lg shadow-sm transition-all cursor-move hover:border-primary/50",
                                            draggedItemIndex === index && "opacity-50 border-dashed border-primary"
                                        )}
                                    >
                                        <div className="flex items-center justify-center w-6 md:w-8 text-muted-foreground font-medium text-sm md:text-base">
                                            {index + 1}
                                        </div>
                                        <div className="h-12 w-10 md:h-16 md:w-12 bg-muted rounded overflow-hidden flex-shrink-0 border">
                                            <img src={pdf.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm md:text-base">{pdf.file.name}</p>
                                            <p className="text-xs text-muted-foreground">{pdf.pageCount} pages • {(pdf.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-8 w-8 md:h-10 md:w-10"
                                            onClick={() => removeFile(pdf.id)}
                                        >
                                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Merge PDFs</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong>Upload:</strong> Select or drag and drop multiple PDF files.</li>
                            <li><strong>Reorder:</strong> Drag the files in the list to arrange them in your desired order.</li>
                            <li><strong>Merge:</strong> Click "Merge PDF" to combine them into one document.</li>
                            <li><strong>Download:</strong> Save the newly created single PDF file.</li>
                        </ul>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="application/pdf" multiple />
            <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
        </div>
    );
}

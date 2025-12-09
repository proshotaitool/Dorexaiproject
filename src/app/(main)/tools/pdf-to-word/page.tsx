'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, RefreshCw, CheckCircle, FileType } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { convertPdfToWord } from '@/app/actions/convert-pdf';

export default function PdfToWordPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [convertedWordUrl, setConvertedWordUrl] = useState<string | null>(null);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

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

    const toolPath = '/tools/pdf-to-word';
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
            title: 'PDF to Word Converter',
            text: 'Check out this PDF to Word Converter tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const handleFiles = (incomingFiles: FileList | null) => {
        if (incomingFiles && incomingFiles.length > 0) {
            const selectedFile = incomingFiles[0];
            if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
                setFile(selectedFile);
                setConvertedWordUrl(null);
                setPreviewPdfUrl(URL.createObjectURL(selectedFile));
            } else {
                toast({ title: 'Invalid File', description: 'Please upload a valid .pdf file.', variant: 'destructive' });
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        setConvertedWordUrl(null);
        setPreviewPdfUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

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
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleConvert = async () => {
        if (!file) {
            toast({ title: 'No File', description: 'Please upload a PDF document.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setConvertedWordUrl(null);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const formData = new FormData();
            formData.append('file', file);

            const result = await convertPdfToWord(formData);
            setConvertedWordUrl(result);

            toast({
                title: 'Conversion Successful',
                description: 'Your Word document is ready to be downloaded.',
            });

        } catch (error) {
            console.error("Word Conversion Error:", error);
            toast({ title: 'Error', description: 'Could not process conversion. Please try again.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!convertedWordUrl) return;

        try {
            await sessionStorage.setItem('pdf-to-word-file', convertedWordUrl);
            await sessionStorage.setItem('pdf-to-word-filename', file?.name.replace(/\.pdf$/i, '.docx') || 'converted.docx');
            router.push('/download/pdf-to-word');

        } catch (error) {
            console.error("Download preparation error:", error);
            toast({ title: 'Error', description: 'Could not prepare the file for download.', variant: 'destructive' });
        }
    };

    const handleReset = () => {
        removeFile();
    }

    const relatedTools = tools.filter(tool => ['/tools/word-to-pdf', '/tools/merge-pdf'].includes(tool.path));

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
                            <BreadcrumbPage>PDF to Word</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Free PDF to Word Converter</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Convert your PDF files to editable Word documents (.docx) instantly.
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
                className={cn('max-w-3xl mx-auto transition-colors', isDragging && 'bg-primary/10')}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="p-4 md:p-6 text-center">
                    {!file ? (
                        <div className="border-2 border-dashed rounded-xl p-8 md:p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                            <FileType className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-base md:text-lg font-semibold">Drag and drop your PDF file here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none">
                                <Upload className="mr-2 h-4 w-4" />
                                Select PDF File
                            </Button>
                        </div>
                    ) : (
                        <div className="text-left">
                            <h3 className="text-lg font-semibold text-center mb-4">File to Convert</h3>
                            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                                <div className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                                    <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                                    <span className="flex-1 truncate font-medium">{file.name}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={removeFile}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* PDF Preview */}
                            {previewPdfUrl && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Document Preview</h4>
                                    <div className="border rounded-lg overflow-hidden h-[300px] md:h-[500px] bg-muted/20">
                                        <iframe
                                            src={previewPdfUrl}
                                            className="w-full h-full"
                                            title="PDF Preview"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                                {!convertedWordUrl ? (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleConvert} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                        {isLoading ? 'Converting...' : 'Convert to Word'}
                                    </Button>
                                ) : (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleDownload}>
                                        <Download className="mr-2 h-5 w-5" />
                                        Download Word Doc
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">Clear</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About the PDF to Word Converter</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our PDF to Word Converter allows you to transform your PDF documents into editable Microsoft Word files (.docx).
                            <br /><br />
                            Note: To preserve the exact layout of your PDF, we convert each page into a high-quality image within the Word document. This ensures that fonts, images, and complex layouts remain exactly as they appeared in the original PDF.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Convert PDF to Word</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Upload Your File:</span> Drag and drop your .pdf file into the box or click to select it.</li>
                            <li><span className="font-semibold text-foreground">Convert:</span> Click the "Convert to Word" button.</li>
                            <li><span className="font-semibold text-foreground">Download:</span> Once the conversion is complete, click "Download Word Doc" to save your new file.</li>
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                        <ul className="space-y-4 text-muted-foreground">
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Layout Preservation:</span> Keeps your document looking exactly like the original.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Privacy Focused:</span> Your files are processed securely and not stored permanently.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Free to Use:</span> No hidden fees or subscriptions required.</div></li>
                        </ul>
                    </CardContent>
                </Card>
            </section>
            <RelatedTools tools={relatedTools} />
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept=".pdf,application/pdf" />
            <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
        </div>
    );
}

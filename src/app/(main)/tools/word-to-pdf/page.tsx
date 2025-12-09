'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, PlusCircle, RefreshCw, CheckCircle, FileType } from 'lucide-react';
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
import { convertWordToPdf, getWordPreview } from '@/app/actions/convert-word';

export default function WordToPdfPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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

    const toolPath = '/tools/word-to-pdf';
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
            title: 'Word to PDF Converter',
            text: 'Check out this Word to PDF Converter tool!',
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
        }
    };

    const handleFiles = async (incomingFiles: FileList | null) => {
        if (incomingFiles && incomingFiles.length > 0) {
            const selectedFile = incomingFiles[0];
            if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.name.endsWith('.docx')) {
                setFile(selectedFile);
                setConvertedPdfUrl(null);
                setPreviewHtml(null);
                setPreviewImageUrl(null);

                // Generate preview
                try {
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    const html = await getWordPreview(formData);
                    setPreviewHtml(html);
                } catch (error) {
                    console.error("Preview generation failed", error);
                }
            } else {
                toast({ title: 'Invalid File', description: 'Please upload a valid .docx file.', variant: 'destructive' });
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        setConvertedPdfUrl(null);
        setPreviewHtml(null);
        setPreviewImageUrl(null);
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
            toast({ title: 'No File', description: 'Please upload a Word document.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setConvertedPdfUrl(null);

        try {
            if (user && firestore) {
                await deductCredit(firestore, user.uid);
            }

            const formData = new FormData();
            formData.append('file', file);

            const result = await convertWordToPdf(formData);

            // Handle both string (legacy) and object response
            if (typeof result === 'string') {
                setConvertedPdfUrl(result);
            } else {
                setConvertedPdfUrl(result.pdfUrl);
                setPreviewImageUrl(result.previewUrl);
            }

            toast({
                title: 'Conversion Successful',
                description: 'Your PDF is ready to be downloaded.',
            });

        } catch (error) {
            console.error("PDF Conversion Error:", error);
            toast({ title: 'Error', description: 'Could not process PDF conversion. Please try again.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!convertedPdfUrl) return;

        try {
            await sessionStorage.setItem('word-to-pdf-file', convertedPdfUrl);
            await sessionStorage.setItem('word-to-pdf-filename', file?.name.replace(/\.docx?$/i, '.pdf') || 'converted.pdf');
            router.push('/download/word-to-pdf');

        } catch (error) {
            console.error("Download preparation error:", error);
            toast({ title: 'Error', description: 'Could not prepare the file for download.', variant: 'destructive' });
        }
    };

    const handleReset = () => {
        removeFile();
    }

    const relatedTools = tools.filter(tool => ['/tools/jpg-to-pdf', '/tools/merge-pdf'].includes(tool.path));

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
                            <BreadcrumbPage>Word to PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">Free Word to PDF Converter</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Convert your DOCX files to PDF documents instantly. No installation required.
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
                            <h3 className="mt-4 text-base md:text-lg font-semibold">Drag and drop your Word file here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none">
                                <Upload className="mr-2 h-4 w-4" />
                                Select Word File
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

                            {/* Word Preview */}
                            {previewHtml && !convertedPdfUrl && (
                                <div className="mt-6 border rounded-lg p-4 bg-white min-h-[200px] max-h-[400px] md:min-h-[300px] md:max-h-[500px] overflow-y-auto shadow-inner">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-white pb-2 border-b">Document Preview</h4>
                                    <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                                    />
                                </div>
                            )}

                            {/* PDF Preview (Image) */}
                            {previewImageUrl && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">PDF Preview</h4>
                                    <div className="border rounded-lg overflow-hidden shadow-lg bg-muted/20 flex justify-center p-4">
                                        <img
                                            src={previewImageUrl}
                                            alt="PDF Preview"
                                            className="max-w-full h-auto shadow-md border"
                                            style={{ maxHeight: '600px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
                                {!convertedPdfUrl ? (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleConvert} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                                        {isLoading ? 'Converting...' : 'Convert to PDF'}
                                    </Button>
                                ) : (
                                    <Button className="w-full sm:max-w-xs h-12 text-base" onClick={handleDownload}>
                                        <Download className="mr-2 h-5 w-5" />
                                        Download PDF
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
                        <h2 className="text-2xl font-semibold mb-4">About the Word to PDF Converter</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our Word to PDF Converter allows you to transform your Microsoft Word documents (.docx) into professional PDF files. This ensures your document's formatting remains consistent across all devices and operating systems.
                            <br /><br />
                            Whether you're sending a resume, a report, or a contract, converting to PDF is the best way to ensure the recipient sees exactly what you intended. Our tool is fast, free, and easy to use.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Convert Word to PDF</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Upload Your File:</span> Drag and drop your .docx file into the box or click to select it.</li>
                            <li><span className="font-semibold text-foreground">Convert:</span> Click the "Convert to PDF" button. Our server will process your file instantly.</li>
                            <li><span className="font-semibold text-foreground">Download:</span> Once the conversion is complete, click "Download PDF" to save your new file.</li>
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                        <ul className="space-y-4 text-muted-foreground">
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Accurate Conversion:</span> Preserves text, images, and basic formatting from your Word document.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Privacy Focused:</span> Your files are processed securely and not stored permanently.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Universal Compatibility:</span> PDFs work on any device, ensuring your document looks great everywhere.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Free to Use:</span> No hidden fees or subscriptions required for basic use.</div></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Does it support .doc files?</AccordionTrigger>
                                <AccordionContent>Currently, we only support the modern .docx format. If you have an older .doc file, please open it in Word and save it as .docx first.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Will my formatting be preserved exactly?</AccordionTrigger>
                                <AccordionContent>We strive to preserve as much formatting as possible. However, complex layouts, specific fonts, or advanced Word features might look slightly different in the PDF. For most standard documents, the result is excellent.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Is it secure?</AccordionTrigger>
                                <AccordionContent>Yes. Your file is sent to our server for processing and immediately discarded after the conversion is done. We do not store your documents.</AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>
            <RelatedTools tools={relatedTools} />
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
        </div>
    );
}

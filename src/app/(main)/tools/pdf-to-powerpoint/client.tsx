'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, FileType, X, Download, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
// import pptxgen from "pptxgenjs"; // Removed for dynamic import

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - using CDN to avoid webpack issues in Next.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfPage {
    pageNumber: number;
    imageUrl: string;
    width: number;
    height: number;
    selected: boolean;
}

export default function PdfToPowerPointClient() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pages, setPages] = useState<PdfPage[]>([]);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                toast({
                    title: "Invalid File",
                    description: "Please upload a valid PDF file.",
                    variant: "destructive",
                });
                return;
            }
            setFile(selectedFile);
            await processPdf(selectedFile);
        }
    };

    const processPdf = async (pdfFile: File) => {
        setLoading(true);
        setPages([]);
        setProgress(0);

        try {
            console.log('Starting PDF processing for:', pdfFile.name);
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log('PDF loaded, pages:', pdf.numPages);

            const numPages = pdf.numPages;
            const newPages: PdfPage[] = [];

            for (let i = 1; i <= numPages; i++) {
                console.log(`Processing page ${i}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Scale for better quality
                console.log(`Page ${i} viewport:`, viewport.width, viewport.height);

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext as any).promise;
                    console.log(`Page ${i} rendered`);

                    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
                    console.log(`Page ${i} data URL length:`, imageUrl.length);

                    newPages.push({
                        pageNumber: i,
                        imageUrl: imageUrl,
                        width: viewport.width,
                        height: viewport.height,
                        selected: true
                    });
                }

                setProgress(Math.round((i / numPages) * 100));
            }

            setPages(newPages);
        } catch (error) {
            console.error('Error processing PDF:', error);
            toast({
                title: "Error",
                description: "Failed to process PDF file.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePageSelection = (index: number) => {
        setPages(prev => prev.map((page, i) =>
            i === index ? { ...page, selected: !page.selected } : page
        ));
    };

    const convertToPptx = async () => {
        const selectedPages = pages.filter(p => p.selected);
        if (selectedPages.length === 0) {
            toast({
                title: "No Pages Selected",
                description: "Please select at least one page to convert.",
                variant: "destructive",
            });
            return;
        }

        setProcessing(true);
        try {
            const pptxgen = (await import("pptxgenjs")).default;
            const pres = new pptxgen();

            selectedPages.forEach(page => {
                const slide = pres.addSlide();
                // Add image to slide, fitting to page
                slide.addImage({
                    data: page.imageUrl,
                    x: 0,
                    y: 0,
                    w: "100%",
                    h: "100%",
                    sizing: { type: "contain", w: "100%", h: "100%" }
                });
            });

            // Generate Blob URL instead of downloading directly
            const blob = await pres.write({ outputType: 'blob' }) as Blob;
            const blobUrl = URL.createObjectURL(blob);
            const filename = `${file?.name.replace('.pdf', '') || 'presentation'}.pptx`;

            // Store in sessionStorage for the download page
            sessionStorage.setItem('download-url', blobUrl);
            sessionStorage.setItem('download-filename', filename);

            // Redirect to download page
            window.location.href = '/download';

        } catch (error) {
            console.error('Error creating PPTX:', error);
            toast({
                title: "Error",
                description: "Failed to create PowerPoint file.",
                variant: "destructive",
            });
            setProcessing(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPages([]);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                            <BreadcrumbPage>PDF to PowerPoint</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                    PDF to PowerPoint Converter
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Convert your PDF documents into editable PowerPoint presentations with Live Preview.
                </p>
            </div>

            {/* Upload Section */}
            {!file && (
                <Card
                    className="p-12 border-2 border-dashed border-muted-foreground/25 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 bg-muted/5"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                        <Upload className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">Click to Upload PDF</h3>
                        <p className="text-muted-foreground mt-1">or drag and drop your file here</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf"
                        className="hidden"
                    />
                </Card>
            )}

            {/* Preview & Action Section */}
            {file && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Toolbar */}
                    <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-10 shadow-lg border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <FileType className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-medium truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{pages.length} Pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="outline" onClick={clearFile} disabled={processing}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                onClick={convertToPptx}
                                disabled={loading || processing || pages.length === 0}
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 flex-1 md:flex-none"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PowerPoint
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Live Preview Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-lg font-medium">Processing PDF...</p>
                            <p className="text-muted-foreground">Rendering page {Math.round((progress / 100) * pages.length)}...</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Eye className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">Live Preview</h2>
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {pages.filter(p => p.selected).length} of {pages.length} pages selected
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {pages.map((page, index) => (
                                    <div
                                        key={page.pageNumber}
                                        className={`relative group cursor-pointer transition-all duration-200 ${!page.selected ? 'opacity-50 grayscale' : ''}`}
                                        onClick={() => togglePageSelection(index)}
                                    >
                                        <div className={`rounded-xl overflow-hidden border-2 shadow-sm aspect-[3/4] bg-white relative ${page.selected ? 'border-primary ring-2 ring-primary/20' : 'border-muted'}`}>
                                            <img
                                                src={page.imageUrl}
                                                alt={`Page ${page.pageNumber}`}
                                                className="w-full h-full object-contain"
                                            />

                                            {/* Selection Indicator */}
                                            <div className="absolute top-2 right-2">
                                                {page.selected ? (
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                                                        <CheckCircle className="h-5 w-5 fill-current" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-muted/80 text-muted-foreground rounded-full p-1 shadow-md">
                                                        <div className="h-5 w-5 rounded-full border-2 border-current" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Page Number */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                                                Page {page.pageNumber}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Section */}
            <div className="max-w-4xl mx-auto space-y-12 mb-16">
                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">About PDF to PowerPoint Converter</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Our PDF to PowerPoint converter is a powerful tool designed to transform your static PDF documents into editable PowerPoint presentations.
                        Whether you need to repurpose a report, extract slides from a lecture, or simply make edits to a PDF presentation, this tool preserves
                        your layout and formatting while giving you the flexibility of PowerPoint. It works entirely in your browser, ensuring your files remain private and secure.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">How to Use</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">1</div>
                            <h3 className="font-semibold text-xl mb-2">Upload PDF</h3>
                            <p className="text-muted-foreground">Click the upload area or drag and drop your PDF file to get started.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">2</div>
                            <h3 className="font-semibold text-xl mb-2">Select Pages</h3>
                            <p className="text-muted-foreground">Preview your document and select the specific pages you want to convert to slides.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">3</div>
                            <h3 className="font-semibold text-xl mb-2">Convert & Download</h3>
                            <p className="text-muted-foreground">Click "Download PowerPoint" to instantly generate and save your .pptx file.</p>
                        </Card>
                    </div>
                </section>
            </div>

            <RelatedTools tools={tools.filter(t => ['Crop PDF', 'Merge PDF', 'Split PDF'].includes(t.name))} />
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, FileType, X, Download, Crop as CropIcon, RotateCcw } from 'lucide-react';
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
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { PDFDocument, rgb } from 'pdf-lib';

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function CropPdfClient() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageImage, setPageImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
    const [originalPdfBytes, setOriginalPdfBytes] = useState<ArrayBuffer | null>(null);
    const [isCropped, setIsCropped] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
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
            await loadPdf(selectedFile);
        }
    };

    const loadPdf = async (pdfFile: File | ArrayBuffer) => {
        setLoading(true);
        try {
            const arrayBuffer = pdfFile instanceof File ? await pdfFile.arrayBuffer() : pdfFile;
            if (pdfFile instanceof File) {
                setOriginalPdfBytes(arrayBuffer);
            }

            // Load into pdf-lib for manipulation
            const pdf = await PDFDocument.load(arrayBuffer);
            setPdfDoc(pdf);
            setNumPages(pdf.getPageCount());

            // Render first page
            await renderPage(arrayBuffer, currentPage);
        } catch (error) {
            console.error('Error loading PDF:', error);
            toast({
                title: "Error",
                description: "Failed to load PDF file.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderPage = async (pdfBytes: ArrayBuffer, pageNum: number) => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
            const page = await pdf.getPage(pageNum);

            // Render at high quality
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                // @ts-ignore - pdfjs-dist types are slightly mismatched
                await page.render(renderContext).promise;
                setPageImage(canvas.toDataURL('image/jpeg'));
            }
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    };

    const handlePageChange = async (newPage: number) => {
        if (newPage >= 1 && newPage <= numPages) {
            setCurrentPage(newPage);
            setCrop(undefined);
            setCompletedCrop(undefined);

            if (pdfDoc) {
                const pdfBytes = await pdfDoc.save();
                // @ts-ignore - Uint8Array vs ArrayBuffer mismatch
                await renderPage(pdfBytes.buffer, newPage);
            } else if (originalPdfBytes) {
                await renderPage(originalPdfBytes, newPage);
            }
        }
    };

    const applyCrop = async (applyToAll: boolean) => {
        if (!pdfDoc || !completedCrop || !imageRef.current || !originalPdfBytes) return;

        setProcessing(true);
        try {
            const image = imageRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Get PDF page dimensions
            const page = pdfDoc.getPage(currentPage - 1);
            const { width, height } = page.getSize();

            const pdfWidth = width;
            const pdfHeight = height;

            const imgWidth = image.naturalWidth;
            const imgHeight = image.naturalHeight;

            const ratioX = pdfWidth / imgWidth;
            const ratioY = pdfHeight / imgHeight;

            const cropX = completedCrop.x * scaleX * ratioX;
            const cropY = completedCrop.y * scaleY * ratioY;
            const cropWidth = completedCrop.width * scaleX * ratioX;
            const cropHeight = completedCrop.height * scaleY * ratioY;

            // PDF CropBox: [x, y, width, height]
            // x, y are coordinates of bottom-left corner of the crop box
            // But setCropBox takes { x, y, width, height }
            // x = cropX
            // y = pdfHeight - cropY - cropHeight (flip Y axis)

            const pdfCropX = cropX;
            const pdfCropY = pdfHeight - cropY - cropHeight;

            const pagesToCrop = applyToAll ? pdfDoc.getPages() : [page];

            pagesToCrop.forEach(p => {
                p.setCropBox(pdfCropX, pdfCropY, cropWidth, cropHeight);
            });

            // Save the modified PDF to bytes
            const pdfBytes = await pdfDoc.save();

            // Reload the modified PDF into state
            // @ts-ignore - Uint8Array vs ArrayBuffer mismatch
            const newPdfDoc = await PDFDocument.load(pdfBytes);
            setPdfDoc(newPdfDoc);

            // Re-render the current page to show the crop
            // @ts-ignore - Uint8Array vs ArrayBuffer mismatch
            await renderPage(pdfBytes.buffer, currentPage);

            setIsCropped(true);
            setCrop(undefined);
            setCompletedCrop(undefined);

            toast({
                title: "Cropped!",
                description: "Preview updated. Click Download to save.",
            });

        } catch (error) {
            console.error('Error cropping PDF:', error);
            toast({
                title: "Error",
                description: "Failed to crop PDF.",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!pdfDoc) return;
        try {
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const filename = `cropped-${file?.name || 'document.pdf'}`;

            // Store in sessionStorage for the download page
            sessionStorage.setItem('download-url', url);
            sessionStorage.setItem('download-filename', filename);

            // Redirect to download page
            window.location.href = '/download';

        } catch (error) {
            console.error("Download error:", error);
            toast({
                title: "Error",
                description: "Failed to download PDF.",
                variant: "destructive",
            });
        }
    };

    const handleReset = async () => {
        if (originalPdfBytes) {
            setIsCropped(false);
            setCrop(undefined);
            setCompletedCrop(undefined);
            await loadPdf(originalPdfBytes);
            toast({
                title: "Reset",
                description: "Changes discarded.",
            });
        }
    };

    const clearFile = () => {
        setFile(null);
        setPdfDoc(null);
        setOriginalPdfBytes(null);
        setPageImage(null);
        setNumPages(0);
        setCurrentPage(1);
        setIsCropped(false);
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
                            <BreadcrumbPage>Crop PDF</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                    Crop PDF Tool
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Trim margins and crop pages in your PDF documents.
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

            {/* Editor Section */}
            {file && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Toolbar */}
                    <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-10 shadow-lg border-primary/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <FileType className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-medium truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{numPages} Pages • Page {currentPage}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-medium w-16 text-center">
                                {currentPage} / {numPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= numPages}
                            >
                                Next
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="outline" onClick={clearFile} disabled={processing}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>

                            {isCropped ? (
                                <>
                                    <Button variant="outline" onClick={handleReset} disabled={processing}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleDownload}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => applyCrop(false)}
                                        disabled={!completedCrop || processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CropIcon className="mr-2 h-4 w-4" />}
                                        Crop Page
                                    </Button>
                                    <Button
                                        onClick={() => applyCrop(true)}
                                        disabled={!completedCrop || processing}
                                        variant="secondary"
                                    >
                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CropIcon className="mr-2 h-4 w-4" />}
                                        Crop All
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Crop Area */}
                    <div className="flex justify-center bg-muted/20 p-8 rounded-xl border min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-lg font-medium">Loading PDF...</p>
                            </div>
                        ) : pageImage ? (
                            isCropped ? (
                                <img
                                    src={pageImage}
                                    alt="Cropped PDF Page"
                                    className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                                />
                            ) : (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    className="shadow-2xl"
                                >
                                    <img
                                        ref={imageRef}
                                        src={pageImage}
                                        alt="PDF Page"
                                        className="max-w-full max-h-[80vh] object-contain"
                                    />
                                </ReactCrop>
                            )
                        ) : null}
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div className="max-w-4xl mx-auto space-y-12 mb-16">
                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">About Crop PDF Tool</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Our Crop PDF tool allows you to easily trim margins and remove unwanted areas from your PDF pages.
                        Whether you need to focus on specific content, remove header/footer information, or adjust the page size for printing,
                        this tool provides a visual interface to crop your documents with precision. You can crop individual pages or apply the same crop to the entire document.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-3xl font-bold">How to Use</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">1</div>
                            <h3 className="font-semibold text-xl mb-2">Upload PDF</h3>
                            <p className="text-muted-foreground">Upload the PDF file you want to crop.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">2</div>
                            <h3 className="font-semibold text-xl mb-2">Select Area</h3>
                            <p className="text-muted-foreground">Draw a box on the preview to define the area you want to keep.</p>
                        </Card>
                        <Card className="p-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">3</div>
                            <h3 className="font-semibold text-xl mb-2">Crop & Download</h3>
                            <p className="text-muted-foreground">Click "Crop Page" or "Crop All" to apply, then download your new PDF.</p>
                        </Card>
                    </div>
                </section>
            </div>

            <RelatedTools tools={tools.filter(t => ['PDF to PowerPoint', 'Split PDF', 'Compress PDF'].includes(t.name))} />
        </div>
    );
}

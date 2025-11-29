
'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Bookmark, Share2, Loader2, FileText, X, PlusCircle, RefreshCw, CheckCircle } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function JpgToPdfPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string | null>(null);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);

  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  
  const toolPath = '/tools/jpg-to-pdf';
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
      title: 'JPG to PDF Converter',
      text: 'Check out this JPG to PDF Converter tool!',
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
    if (incomingFiles) {
      const newFiles = Array.from(incomingFiles).filter(file => file.type === 'image/jpeg' || file.type === 'image/jpg');
      const rejectedCount = incomingFiles.length - newFiles.length;
      if (rejectedCount > 0) {
        toast({ title: 'Invalid Files', description: `${rejectedCount} file(s) were not JPGs and have been ignored.`, variant: 'destructive' });
      }
      setFiles(prev => [...prev, ...newFiles]);
      setConvertedPdfUrl(null); // Reset on new files
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setConvertedPdfUrl(null);
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
    if(e.target) {
        e.target.value = '';
    }
  };
  const handleUploadClick = () => fileInputRef.current?.click();
  
  const handleConvert = async () => {
    if (files.length === 0) {
      toast({ title: 'No Files', description: 'Please upload at least one JPG image.', variant: 'destructive'});
      return;
    }

    setIsLoading(true);
    setConvertedPdfUrl(null);

    try {
      if(user && firestore) {
        await deductCredit(firestore, user.uid);
      }
      
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        const jpgImageBytes = await file.arrayBuffer();
        const jpgImage = await pdfDoc.embedJpg(jpgImageBytes);
        const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
        page.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: jpgImage.width,
          height: jpgImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setConvertedPdfUrl(url);
      
      toast({
          title: 'Conversion Successful',
          description: 'Your PDF is ready to be downloaded.',
      });

    } catch (error) {
      console.error("PDF Conversion Error:", error);
      toast({ title: 'Error', description: 'Could not process PDF conversion. Please ensure all files are valid JPGs.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  };

  const handleDownload = async () => {
    if (!convertedPdfUrl) return;

    try {
      const blob = await fetch(convertedPdfUrl).then(res => res.blob());
      const dataUrl = await blobToDataURL(blob);

      await sessionStorage.setItem('jpg-to-pdf-file', dataUrl);
      await sessionStorage.setItem('jpg-to-pdf-filename', 'dorex-ai-converted.pdf');
      router.push('/download/jpg-to-pdf');

    } catch (error) {
      console.error("Download preparation error:", error);
      toast({ title: 'Error', description: 'Could not prepare the file for download.', variant: 'destructive' });
    }
  };
  
  const handleReset = () => {
      setFiles([]);
      setConvertedPdfUrl(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  const relatedTools = tools.filter(tool => ['/tools/merge-pdf', '/tools/convert-to-jpg'].includes(tool.path));

  return (
    <div className="container py-12">
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
              <BreadcrumbPage>JPG to PDF</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free JPG to PDF Converter</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Quickly convert one or more JPG images into a single, easy-to-share PDF document online.
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
            <CardContent className="p-6 text-center">
              {files.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Drag and drop your JPG images here</h3>
                    <p className="text-muted-foreground mt-2">or</p>
                    <Button className="mt-4 pointer-events-none">
                        <Upload className="mr-2 h-4 w-4" />
                        Select Images
                    </Button>
                </div>
              ) : (
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-center mb-4">Files to Convert ({files.length})</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                        <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                        <span className="flex-1 truncate font-medium">{file.name}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                   <div className="flex justify-center items-center gap-4 mt-6">
                      <Button variant="outline" onClick={handleUploadClick} disabled={isLoading}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add More Files
                      </Button>
                      {!convertedPdfUrl ? (
                         <Button className="w-full max-w-xs h-12 text-base" onClick={handleConvert} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5"/>}
                            {isLoading ? 'Converting...' : 'Convert to PDF'}
                        </Button>
                      ) : (
                        <Button className="w-full max-w-xs h-12 text-base" onClick={handleDownload}>
                            <Download className="mr-2 h-5 w-5"/>
                            Download PDF
                        </Button>
                      )}
                      <Button variant="secondary" onClick={handleReset} disabled={isLoading}>Clear All</Button>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
           <section className="mt-16 space-y-8">
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">About the JPG to PDF Converter</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        The JPG to PDF Converter is a simple yet powerful tool for anyone needing to bundle multiple images into a single document. It's perfect for creating photo albums, compiling scanned documents, or preparing image-based reports. Instead of sending multiple image files, you can combine them into one professional, easy-to-share PDF.
                        <br/><br/>
                        Our tool is designed for speed and convenience. Upload as many JPG files as you need, arrange them in your desired order, and convert them with a single click. The resulting PDF will maintain the quality and dimensions of your original images, ensuring a clean and professional result every time.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">How to Use the JPG to PDF Converter</h2>
                      <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                          <li><span className="font-semibold text-foreground">Upload Your JPGs:</span> Drag and drop or select one or more JPG images to get started.</li>
                          <li><span className="font-semibold text-foreground">Arrange Your Files:</span> The images will be added to the PDF in the order they are listed. You can remove and re-upload files to change the order.</li>
                          <li><span className="font-semibold text-foreground">Convert to PDF:</span> Click the "Convert to PDF" button to merge your images into a single PDF document.</li>
                          <li><span className="font-semibold text-foreground">Download Your File:</span> After conversion, a download button will appear. Click it to save your new PDF file.</li>
                      </ol>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                      <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Batch Conversion:</span> Convert multiple JPG files into a single PDF at once.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">High Quality:</span> The PDF preserves the original quality and dimensions of your images.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Fast and Easy:</span> The simple interface makes the conversion process quick and intuitive.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Secure Processing:</span> All conversions happen in your browser or on our secure servers, and your files are deleted after processing.</div></li>
                      </ul>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Can I convert other image formats besides JPG?</AccordionTrigger>
                            <AccordionContent>This specific tool is optimized for JPG files. For other formats like PNG, WEBP, or GIF, please use our "Convert to PDF" tool, which supports a wider variety of image types.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is there a limit to how many images I can convert at once?</AccordionTrigger>
                            <AccordionContent>While there is no strict limit, we recommend converting a reasonable number of images at a time (e.g., up to 50) for best performance. For very large batches, your browser may run into memory limitations.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Will the PDF be searchable?</AccordionTrigger>
                            <AccordionContent>No, this tool converts images into a PDF. The content of the images (like text) will not be searchable. If you need a searchable PDF, you would need to use an Optical Character Recognition (OCR) tool.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>How are the pages ordered in the final PDF?</AccordionTrigger>
                            <AccordionContent>The images are added to the PDF in the same order they appear in the file list on the page. If you need to reorder them, you can remove the files and upload them again in the desired sequence.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </CardContent>
              </Card>
            </section>
          <RelatedTools tools={relatedTools} />
      <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/jpeg,image/jpg" multiple />
      <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
    </div>
  );
}

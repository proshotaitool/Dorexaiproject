
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, X, PlusCircle, FileDown, Sparkles, Wand2, RefreshCw, Bookmark, Share2, CheckCircle } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import JSZip from 'jszip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestJpgQuality } from '@/ai/flows/suggest-jpg-quality-flow';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { AdSlot } from '@/components/ad-slot';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ImageFile = {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  convertedDataUrl?: string;
  convertedSize: number | null;
  isConverting: boolean;
  isConverted: boolean;
};

type OutputFormat = 'png' | 'webp' | 'gif' | 'bmp';


export default function ConvertFromJpgPage() {
  const router = useRouter();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [quality, setQuality] = useState(90);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);
  
  const toolPath = '/tools/convert-from-jpg';
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
      title: 'Convert from JPG',
      text: 'Check out this Convert from JPG tool!',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  const activeImage = useMemo(() => files.find(f => f.id === activeImageId) || null, [files, activeImageId]);
  const allFilesConverted = files.length > 0 && files.every(f => f.isConverted);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const supportedTypes = ['image/jpeg', 'image/jpg'];
    const newImageFiles: ImageFile[] = Array.from(incomingFiles)
      .filter(file => supportedTypes.includes(file.type))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        convertedUrl: null,
        convertedBlob: null,
        convertedSize: null,
        isConverting: false,
        isConverted: false,
      }));

    const unsupportedCount = incomingFiles.length - newImageFiles.length;
    if (unsupportedCount > 0) {
      toast({ title: 'Some files were skipped', description: `${unsupportedCount} file(s) were not JPGs.`, variant: 'destructive' });
    }

    setFiles(prev => {
        const updatedFiles = [...prev, ...newImageFiles];
        if(!activeImageId && updatedFiles.length > 0) {
            setActiveImageId(updatedFiles[0].id);
        }
        return updatedFiles;
    });
  };
  
  const handleDrag = (e: React.DragEvent, enter: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if(files.length > 0) return;
    setIsDragging(enter);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e, false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);
  const handleUploadClick = () => fileInputRef.current?.click();

  const removeFile = (id: string) => {
    setFiles(prev => {
      const remainingFiles = prev.filter(f => f.id !== id);
      if (activeImageId === id) {
        setActiveImageId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
      }
      return remainingFiles;
    });
  };
  
  const resetAll = () => {
    files.forEach(f => {
      if(f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
    setActiveImageId(null);
    setIsProcessingAll(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const convertSingleImage = useCallback(async (fileToConvert: ImageFile): Promise<ImageFile | null> => {
    if (fileToConvert.isConverting) return null;

    setFiles(prev => prev.map(f => f.id === fileToConvert.id ? { ...f, isConverting: true } : f));
    
    return new Promise(async (resolvePromise) => {
        const image = document.createElement('img');
        image.src = fileToConvert.originalUrl;
        
        try {
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(image, 0, 0);

            const mimeType = `image/${outputFormat}`;
            const qualityValue = outputFormat === 'webp' ? quality / 100 : undefined;

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, mimeType, qualityValue);
            });

            if (!blob) throw new Error("Could not create image blob");
            
            const convertedUrl = URL.createObjectURL(blob);
            const convertedDataUrl = await blobToDataURL(blob);
            
            const updatedFile = {
              ...fileToConvert,
              isConverting: false,
              isConverted: true,
              convertedUrl,
              convertedBlob: blob,
              convertedSize: blob.size,
              convertedDataUrl: convertedDataUrl
            };

            setFiles(prev => prev.map(f => f.id === fileToConvert.id ? updatedFile : f));
            resolvePromise(updatedFile);
        } catch(error) {
            toast({ title: 'Conversion failed', variant: 'destructive' });
            setFiles(prev => prev.map(f => f.id === fileToConvert.id ? { ...f, isConverting: false } : f));
            resolvePromise(null);
        }
    });
  }, [outputFormat, quality, toast]);

  const blobToDataURL = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };
  
  const convertAllAndDownload = useCallback(async () => {
    setIsProcessingAll(true);
    const conversionPromises = files.map(file => file.isConverted ? Promise.resolve(file) : convertSingleImage(file));
    const results = await Promise.all(conversionPromises);
    setIsProcessingAll(false);

    const successfulConversions = results.filter((f): f is ImageFile => f !== null && f.isConverted);

    if (successfulConversions.length === 0) {
      toast({ title: "Conversion Failed", description: "No images could be converted.", variant: "destructive" });
      return;
    }

    if (successfulConversions.length === 1) {
        const file = successfulConversions[0];
        if (file.convertedDataUrl) {
          sessionStorage.setItem('convert-from-jpg-file', file.convertedDataUrl);
          sessionStorage.setItem('convert-from-jpg-filename', file.file.name.replace(/\.[^/.]+$/, `.${outputFormat}`));
          router.push('/download/convert-from-jpg');
        } else {
            toast({ title: "Error", description: "Could not prepare file for download.", variant: "destructive" });
        }
    } else {
        const zip = new JSZip();
        for (const file of successfulConversions) {
            if (file.convertedBlob) {
              zip.file(file.file.name.replace(/\.[^/.]+$/, `.${outputFormat}`), file.convertedBlob);
            }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const dataUrl = await blobToDataURL(zipBlob);
        await sessionStorage.setItem('convert-from-jpg-file', dataUrl);
        await sessionStorage.setItem('convert-from-jpg-filename', `proshot-ai-converted-${outputFormat}.zip`);
        router.push('/download/convert-from-jpg');
    }
  }, [files, convertSingleImage, outputFormat, router, toast]);
  
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
      });
    }
  }, [files]);
  
  const relatedTools = tools.filter(tool => ['/tools/convert-to-jpg', '/tools/compress-image'].includes(tool.path));


  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <Breadcrumb className="flex justify-center mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/tools">Tools</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink></BreadcrumbItem>
             <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Convert from JPG</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Convert JPG to PNG, WEBP, and More</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Quickly and easily transform your JPG images into PNG for transparency, WEBP for web optimization, or other popular formats like GIF and BMP.
        </p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <main className="space-y-4">
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
        {files.length === 0 ? (
            <Card 
                className={cn('w-full mx-auto flex items-center justify-center transition-colors', isDragging ? 'bg-primary/10 border-primary' : 'bg-transparent')}
                onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
                onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/jpeg,image/jpg" multiple />
                <CardContent className="p-6 text-center w-full">
                <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Drag & drop your JPG/JPEG images</h3>
                    <p className="text-muted-foreground mt-2">or</p>
                    <Button className="mt-4 pointer-events-none">
                        <ImageIcon className="mr-2 h-4 w-4" /> Select Images
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">Strictly accepts JPG and JPEG formats.</p>
                </div>
                </CardContent>
            </Card>
        ) : (
            <>
            <Card className='w-full aspect-[16/10] flex items-center justify-center bg-muted/30'>
                {activeImage ? (
                    <div className='relative w-full h-full'>
                        <Image src={activeImage.originalUrl} alt="Preview" layout="fill" objectFit="contain" className="rounded-lg" />
                        {(activeImage.isConverting || isProcessingAll) && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Select an image to preview</h3>
                    </div>
                )}
            </Card>
            <Card>
                <CardContent className="p-2">
                    <div className="flex gap-2 items-center overflow-x-auto">
                        {files.map(f => (
                            <div key={f.id} className='relative shrink-0'>
                                <button onClick={() => setActiveImageId(f.id)} className={cn('block w-24 h-16 rounded-md overflow-hidden border-2', activeImageId === f.id ? 'border-primary' : 'border-transparent')}>
                                    <Image src={f.originalUrl} alt={f.file.name} width={96} height={64} className="object-cover w-full h-full" />
                                </button>
                                <Button variant="destructive" size="icon" onClick={() => removeFile(f.id)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10">
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                        <button onClick={handleUploadClick} className='shrink-0 w-24 h-16 rounded-md bg-muted/50 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted'>
                            <PlusCircle className="h-6 w-6" />
                            <span className='text-sm mt-1'>Add More</span>
                        </button>
                    </div>
                </CardContent>
            </Card>
            </>
        )}
        </main>
        
        <aside className='lg:sticky lg:top-24 self-start space-y-6'>
            {files.length > 0 && (
                allFilesConverted ? (
                <Card>
                    <CardHeader>
                    <CardTitle className='text-2xl'>Results</CardTitle>
                    <CardDescription>All images converted to {outputFormat.toUpperCase()}.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                        {files.map(f => (
                        f.isConverted && f.convertedUrl && <div key={f.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                            <div className="truncate pr-2">
                            <p className='font-medium truncate'>{f.file.name.replace(/\.[^/.]+$/, "") + `.${outputFormat}`}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatBytes(f.originalSize)} &rarr; {formatBytes(f.convertedSize || 0)} 
                            </p>
                            </div>
                            <Button size="icon" variant="ghost" asChild>
                            <a href={f.convertedUrl} download={f.file.name.replace(/\.[^/.]+$/, "") + `.${outputFormat}`}>
                                <FileDown className="h-4 w-4" />
                            </a>
                            </Button>
                        </div>
                        ))}
                    </div>
                     <div className="space-y-2 pt-2">
                        <Button onClick={convertAllAndDownload} size="lg" className='w-full h-12 text-base'>
                            <Download className="mr-2 h-5 w-5" />
                            {files.length > 1 ? `Download All (.zip)` : `Download as ${outputFormat.toUpperCase()}`}
                        </Button>
                        <Button onClick={resetAll} size="lg" variant="outline" className='w-full h-12 text-base'>
                            <RefreshCw className='mr-2 h-5 w-5' />
                            Start New
                        </Button>
                    </div>
                    </CardContent>
                </Card>
                ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className='text-2xl'>Settings</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <div className="space-y-2">
                            <Label htmlFor="output-format">Output Format</Label>
                            <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                                <SelectTrigger id="output-format">
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="webp">WEBP</SelectItem>
                                    <SelectItem value="gif">GIF</SelectItem>
                                    <SelectItem value="bmp">BMP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {outputFormat === 'webp' && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="quality">WEBP Quality</Label>
                                    <span className="text-sm font-medium">{quality}</span>
                                </div>
                                <Slider id="quality" value={[quality]} onValueChange={(val) => setQuality(val[0])} max={100} step={1} disabled={!activeImage || isProcessingAll} />
                            </div>
                        )}
                         <Button onClick={convertAllAndDownload} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                            {isProcessingAll ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting...</>
                            ) : (
                                <><RefreshCw className="mr-2 h-5 w-5" />{`Convert to ${outputFormat.toUpperCase()}`}</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ))}
             <AdSlot placement="tools_sidebar" className="h-[250px] w-full" />
        </aside>
      </div>
       <section className="mt-16 space-y-8">
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">About the JPG Converter</h2>
                      <p className="text-muted-foreground leading-relaxed">
                          Our JPG Converter is a versatile tool that allows you to transform your JPG images into a variety of other popular formats. Whether you need a PNG for a transparent background, a WEBP for superior web compression, or a GIF for simple animations, this tool has you covered. It's an essential utility for web designers, content creators, and anyone who needs to manage digital assets across different platforms.
                          <br /><br />
                          The process is simple and fast. Upload your JPGs, select your desired output format, and our tool handles the conversion while maintaining the best possible quality. For WEBP conversion, you can even adjust the quality setting to find the perfect balance between file size and visual fidelity.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">How to Convert from JPG</h2>
                      <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                          <li><span className="font-semibold text-foreground">Upload Your JPG Files:</span> Drag and drop or select one or more JPG or JPEG images to begin.</li>
                          <li><span className="font-semibold text-foreground">Select an Output Format:</span> Choose your desired new format from the dropdown menu, such as PNG, WEBP, GIF, or BMP.</li>
                          <li><span className="font-semibold text-foreground">Adjust Quality (for WEBP):</span> If converting to WEBP, you can use the quality slider to fine-tune the compression level.</li>
                          <li><span className="font-semibold text-foreground">Convert Your Images:</span> Click the "Convert" button to start the process for all your uploaded files.</li>
                          <li><span className="font-semibold text-foreground">Download Your New Files:</span> Once the conversion is complete, download your new images individually or as a single ZIP archive.</li>
                      </ol>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                      <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Multiple Output Formats:</span> Convert JPGs to PNG, WEBP, GIF, and BMP.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Batch Processing:</span> Convert multiple images at once to save time.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Quality Control:</span> Adjust the quality for WEBP images to optimize file size.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Fast and Secure:</span> All conversions are done securely in your browser, and your files are never uploaded to our servers.</div></li>
                      </ul>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Why would I convert a JPG to a PNG?</AccordionTrigger>
                            <AccordionContent>The main reason to convert a JPG to a PNG is if you need a transparent background. JPGs do not support transparency, while PNGs do, making them ideal for logos, icons, and web graphics that need to sit on top of other content.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>What is WEBP and why should I use it?</AccordionTrigger>
                            <AccordionContent>WEBP is a modern image format developed by Google that offers superior compression compared to JPG and PNG, resulting in smaller file sizes with similar quality. It's excellent for improving website loading speed.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Does converting a JPG to another format improve its quality?</AccordionTrigger>
                            <AccordionContent>No, converting an image from a compressed format like JPG will not improve its original quality. The goal of conversion is to change the file type for compatibility or specific features (like transparency), not to enhance the image itself.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </CardContent>
              </Card>
          </section>
      <RelatedTools tools={relatedTools} />
    </div>
  );
}

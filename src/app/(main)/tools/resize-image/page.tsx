
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, X, PlusCircle, FileDown, Lock, Unlock, Sparkles, Wand2, CheckCircle, RefreshCw, Bookmark, Share2 } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import JSZip from 'jszip';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { suggestImageDimensions } from '@/ai/flows/image-resizer-flow';
import { Switch } from '@/components/ui/switch';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type ImageFile = {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  resizedUrl: string | null;
  resizedBlob: Blob | null;
  resizedDataUrl?: string;
  resizedSize: number | null;
  isResizing: boolean;
  isResized: boolean;
};

type ResizeMode = 'pixels' | 'percentage';
type OutputFormat = 'jpeg' | 'png' | 'webp';

export default function ResizeImagePage() {
  const router = useRouter();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const [resizeMode, setResizeMode] = useState<ResizeMode>('pixels');
  const [dimensions, setDimensions] = useState<{ width: string; height: string }>({ width: '', height: '' });
  const [percentage, setPercentage] = useState(100);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(90);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ name: string, width: number, height: number }[]>([]);
  const [view, setView] = useState<'settings' | 'results'>('settings');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);

  const toolPath = '/tools/resize-image';
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
      title: 'AI-Enhanced Image Resizer',
      text: 'Check out this AI-Enhanced Image Resizer tool!',
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

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    const newImageFilePromises: Promise<ImageFile>[] = Array.from(incomingFiles)
      .filter(file => supportedTypes.includes(file.type))
      .map(file => {
        return new Promise((resolve, reject) => {
          const originalUrl = URL.createObjectURL(file);
          const img = document.createElement('img');
          img.onload = () => {
            resolve({
              id: `${file.name}-${file.lastModified}-${Math.random()}`,
              file,
              originalUrl,
              originalSize: file.size,
              originalWidth: img.width,
              originalHeight: img.height,
              resizedUrl: null,
              resizedBlob: null,
              resizedSize: null,
              isResizing: false,
              isResized: false,
            });
          };
          img.onerror = reject;
          img.src = originalUrl;
        });
      });

    Promise.all(newImageFilePromises).then(results => {
      if (results.length !== incomingFiles.length) {
        toast({ title: 'Some files were skipped', description: 'Only image files are supported.', variant: 'default' });
      }

      setFiles(prev => {
        const updatedFiles = [...prev, ...results];
        if (!activeImageId && updatedFiles.length > 0) {
          setActiveImageId(updatedFiles[0].id);
        }
        return updatedFiles;
      });
      setView('settings');
    }).catch(() => {
      toast({ title: 'Error reading file', description: 'Could not load one of the selected images.', variant: 'destructive' });
    });
  };

  const handleDrag = (e: React.DragEvent, enter: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (files.length > 0) return;
    setIsDragging(enter);
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e, false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files);
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.originalUrl) URL.revokeObjectURL(fileToRemove.originalUrl);
      if (fileToRemove?.resizedUrl) URL.revokeObjectURL(fileToRemove.resizedUrl);

      const remainingFiles = prev.filter(f => f.id !== id);
      if (activeImageId === id) {
        setActiveImageId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
      }
      return remainingFiles;
    });
  };

  const resetFiles = () => {
    files.forEach(f => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.resizedUrl) URL.revokeObjectURL(f.resizedUrl);
    });
    setFiles([]);
    setActiveImageId(null);
    setIsProcessingAll(false);
    setDimensions({ width: '', height: '' });
    setPercentage(100);
    setAiSuggestions([]);
    setView('settings');
  }

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const resizeSingleImage = useCallback(async (fileToResize: ImageFile, targetWidth: number, targetHeight: number): Promise<ImageFile | null> => {
    if (fileToResize.isResizing) return null;

    setFiles(prev => prev.map(f => f.id === fileToResize.id ? { ...f, isResizing: true } : f));

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = fileToResize.originalUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, `image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100);
      });

      if (!blob) throw new Error('Failed to create blob');

      const resizedUrl = URL.createObjectURL(blob);
      const resizedDataUrl = await blobToDataURL(blob);
      const updatedFile = {
        ...fileToResize,
        isResizing: false,
        isResized: true,
        resizedUrl,
        resizedBlob: blob,
        resizedDataUrl,
        resizedSize: blob.size,
      };
      setFiles(prev => prev.map(f => {
        if (f.id === fileToResize.id) {
          if (f.resizedUrl) URL.revokeObjectURL(f.resizedUrl);
          return updatedFile;
        }
        return f;
      }));
      return updatedFile;
    } catch (err) {
      toast({ title: 'Resizing failed', description: `Could not process ${fileToResize.file.name}`, variant: 'destructive' });
      setFiles(prev => prev.map(f => f.id === fileToResize.id ? { ...f, isResizing: false } : f));
      return null;
    }
  }, [outputFormat, quality, toast]);

  const resizeAll = async () => {
    const { width, height } = dimensions;
    if (!width || !height || Number(width) <= 0 || Number(height) <= 0) {
      toast({ title: 'Dimensions Required', description: 'Please enter valid width and height.', variant: 'destructive' });
      return;
    }

    setIsProcessingAll(true);
    for (const file of files) {
      await resizeSingleImage(file, Number(width), Number(height));
    }
    setIsProcessingAll(false);
    toast({ title: 'All images resized!', description: 'Ready for download.' });
    setView('results');
  };

  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.isResized && f.resizedBlob);
    if (filesToDownload.length === 0) return;

    if (filesToDownload.length === 1) {
      const file = filesToDownload[0];
      if (file.resizedDataUrl) {
        await sessionStorage.setItem('resize-image-file', file.resizedDataUrl);
        await sessionStorage.setItem('resize-image-filename', file.file.name.replace(/(\\.[^/.]+)/i, `_resized.${outputFormat}`));
        router.push('/download/resize-image');
      } else {
        const dataUrl = await blobToDataURL(file.resizedBlob!);
        await sessionStorage.setItem('resize-image-file', dataUrl);
        await sessionStorage.setItem('resize-image-filename', file.file.name.replace(/(\\.[^/.]+)/i, `_resized.${outputFormat}`));
        router.push('/download/resize-image');
      }
    } else {
      const zip = new JSZip();
      for (const file of filesToDownload) {
        if (file.resizedBlob) {
          zip.file(file.file.name.replace(/(\\.[^/.]+)/i, `_resized.${outputFormat}`), file.resizedBlob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const dataUrl = await blobToDataURL(zipBlob);
      await sessionStorage.setItem('resize-image-file', dataUrl);
      await sessionStorage.setItem('resize-image-filename', `dorex-ai-resized-images.zip`);
      router.push('/download/resize-image');
    }
  };

  const handleAiResize = async () => {
    if (!activeImage) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const result = await suggestImageDimensions({ photoDataUri: activeImage.originalUrl });
      setAiSuggestions(result.suggestions);
    } catch (e) {
      console.error(e);
      toast({ title: 'AI Suggestion Failed', description: 'Could not get AI suggestions.', variant: 'destructive' });
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeImage) {
      if (resizeMode === 'pixels') {
        setDimensions({ width: String(activeImage.originalWidth), height: String(activeImage.originalHeight) });
      }
      setPercentage(100);
      setAiSuggestions([]);
    }
  }, [activeImage, resizeMode]);

  const handleDimensionChange = (value: string, dimension: 'width' | 'height') => {
    const numValue = value;
    if (resizeMode === 'pixels') {
      const newDimensions = { ...dimensions, [dimension]: numValue };
      if (keepAspectRatio && activeImage && numValue !== '' && Number(numValue) > 0) {
        const ratio = activeImage.originalWidth / activeImage.originalHeight;
        if (dimension === 'width') {
          newDimensions.height = String(Math.round(Number(numValue) / ratio));
        } else {
          newDimensions.width = String(Math.round(Number(numValue) * ratio));
        }
      }
      setDimensions(newDimensions);
    }
  };

  useEffect(() => {
    if (activeImage && resizeMode === 'percentage') {
      const scale = percentage / 100;
      setDimensions({
        width: String(Math.round(activeImage.originalWidth * scale)),
        height: String(Math.round(activeImage.originalHeight * scale))
      });
    }
  }, [percentage, resizeMode, activeImage]);

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
        if (f.resizedUrl) URL.revokeObjectURL(f.resizedUrl);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const totalOriginalSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalResizedSize = files.reduce((acc, f) => acc + (f.resizedSize || 0), 0);
  const totalReduction = totalOriginalSize > 0 && totalResizedSize > 0 ? totalOriginalSize - totalResizedSize : 0;
  const totalReductionPercentage = totalOriginalSize > 0 ? (totalReduction / totalOriginalSize) * 100 : 0;

  const PreviewContent = () => {
    if (!activeImage) {
      return (
        <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Select an image to preview</h3>
        </div>
      );
    }

    return (
      <>
        {view === 'results' && activeImage.isResized && activeImage.resizedUrl && activeImage.originalUrl ? (
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={activeImage.originalUrl} alt="Original" />}
            itemTwo={<ReactCompareSliderImage src={activeImage.resizedUrl} alt="Resized" />}
            className="w-full h-full"
          />
        ) : (
          <Image src={activeImage.originalUrl} alt="Original" layout="fill" objectFit="contain" />
        )}

        <div className='absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs z-10 pointer-events-none'>
          {activeImage.originalWidth} x {activeImage.originalHeight} &bull; {formatBytes(activeImage.originalSize)}
          {activeImage.isResized && activeImage.resizedSize && (
            <>
              {' '}&rarr;{' '}
              {activeImage.resizedBlob ? (
                // If we have the blob, we can get dimensions from an image element if needed, 
                // but for now let's assume dimensions state is accurate or use what we have.
                // Actually, activeImage doesn't store resized dimensions explicitly in the type above, 
                // but we can infer or add it. For now, let's show the size.
                // Wait, we do have dimensions in state `dimensions` but that's target.
                // Let's just show the file size change for now, and target dimensions if available.
                <>{dimensions.width} x {dimensions.height} &bull; {formatBytes(activeImage.resizedSize)}</>
              ) : (
                <>{formatBytes(activeImage.resizedSize)}</>
              )}
              <span className="text-green-400 ml-1">
                ({activeImage.resizedSize < activeImage.originalSize ? '-' : '+'}{Math.abs((100 - (activeImage.resizedSize / activeImage.originalSize) * 100)).toFixed(0)}%)
              </span>
            </>
          )}
        </div>
      </>
    );
  };

  const isProcessing = isProcessingAll || files.some(f => f.isResizing);
  const relatedTools = tools.filter(tool => ['/tools/compress-image', '/tools/crop-image'].includes(tool.path));

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <Breadcrumb className="flex justify-center mb-4">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/tools">Tools</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Resize Image</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">AI-Enhanced Image Resizer</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Easily resize any image by pixels or percentage. Use our AI to suggest optimal dimensions for social media, blogs, and more.
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
              className={cn('w-full max-w-lg mx-auto flex items-center justify-center transition-colors', isDragging ? 'bg-primary/10 border-primary' : 'bg-transparent')}
              onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
              <CardContent className="p-6 text-center w-full flex flex-col items-center justify-center">
                <div className="border-2 border-dashed rounded-xl p-8 hover:border-primary transition-colors cursor-pointer w-full flex flex-col items-center justify-center" onClick={handleUploadClick}>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Drag & drop your images here</h3>
                  <p className="text-muted-foreground mt-2">or</p>
                  <Button className="mt-4 pointer-events-none" size="sm">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Select Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className='w-full aspect-[16/10] flex items-center justify-center overflow-hidden bg-muted/20 relative'>
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <PreviewContent />
              </Card>
              <Card>
                <CardContent className="p-2">
                  <div className="flex gap-2 items-center overflow-x-auto">
                    {files.map(f => (
                      <div key={f.id} className='relative shrink-0'>
                        <button onClick={() => setActiveImageId(f.id)} className={cn('block w-24 h-16 rounded-md overflow-hidden border-2', activeImageId === f.id ? 'border-primary' : 'border-transparent')}>
                          <Image src={f.originalUrl} alt={f.file.name} width={96} height={64} className="object-cover w-full h-full" />
                        </button>
                        <Button variant="destructive" size="icon" onClick={() => removeFile(f.id)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"><X className="h-4 w-4" /></Button>
                        {f.isResized && <CheckCircle className="absolute bottom-1 right-1 h-5 w-5 text-white bg-green-500 rounded-full" />}
                        {f.isResizing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                      </div>
                    ))}
                    <button onClick={handleUploadClick} className='shrink-0 w-24 h-16 rounded-md bg-muted/50 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted'>
                      <PlusCircle className="h-6 w-6" /><span className='text-sm mt-1'>Add More</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
        <aside className="lg:sticky lg:top-24 space-y-6">
          {files.length > 0 && (
            view === 'settings' ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-2xl'>Resize Options</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='flex items-center justify-between p-1 border rounded-md'>
                    <div className='flex items-center gap-1'>
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      <Label htmlFor="ai-resize" className='font-semibold text-purple-600'>AI Smart Resize</Label>
                    </div>
                    <Switch id="ai-resize" onCheckedChange={(c) => c && handleAiResize()} disabled={!activeImage || isAiLoading} />
                  </div>
                  {isAiLoading && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />AI is thinking...</div>}
                  {aiSuggestions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {aiSuggestions.map(s => (
                        <Button key={s.name} variant="outline" size="sm" className="h-auto py-2 flex-col items-start" onClick={() => { setResizeMode('pixels'); setDimensions({ width: String(s.width), height: String(s.height) }); }}>
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.width}x{s.height}px</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className='grid grid-cols-2 gap-2 bg-muted p-1 rounded-md'>
                    <Button variant={resizeMode === 'pixels' ? 'secondary' : 'ghost'} size="sm" onClick={() => setResizeMode('pixels')}>By Pixels</Button>
                    <Button variant={resizeMode === 'percentage' ? 'secondary' : 'ghost'} size="sm" onClick={() => setResizeMode('percentage')}>By Percentage</Button>
                  </div>

                  {resizeMode === 'pixels' ? (
                    <div className='flex items-center gap-2'>
                      <Input type="number" placeholder="Width" value={dimensions.width} onChange={e => handleDimensionChange(e.target.value, 'width')} disabled={!activeImage} />
                      <Button variant="ghost" size="icon" onClick={() => setKeepAspectRatio(!keepAspectRatio)}>
                        {keepAspectRatio ? <Lock className="h-5 w-5 text-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                      </Button>
                      <Input type="number" placeholder="Height" value={dimensions.height} onChange={e => handleDimensionChange(e.target.value, 'height')} disabled={!activeImage || keepAspectRatio} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><Label>Scale ({percentage}%)</Label><span className="text-sm text-muted-foreground">{dimensions.width} x {dimensions.height}px</span></div>
                      <Slider value={[percentage]} onValueChange={(v) => setPercentage(v[0])} max={200} step={1} disabled={!activeImage} />
                    </div>
                  )}

                  <CardTitle className="text-xl border-t pt-4">Output Options</CardTitle>
                  <div className='space-y-2'>
                    <Label>Output Format</Label>
                    <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpeg">JPEG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="webp">WEBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quality ({quality})</Label>
                    <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} disabled={outputFormat === 'png'} />
                  </div>
                  <Button onClick={resizeAll} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll || !dimensions.width || !dimensions.height}>
                    {isProcessingAll ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Resizing...</> : `Resize ${files.length} Image(s)`}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Total reduction: {formatBytes(totalReduction)} ({totalReductionPercentage.toFixed(1)}%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                    {files.filter(f => f.isResized).map(f => (
                      <Card key={f.id} className="p-3">
                        <div className="flex items-center gap-4">
                          <Image src={f.resizedUrl!} alt={f.file.name} width={40} height={40} className="rounded-md aspect-square object-cover" />
                          <div className="flex-1 truncate">
                            <p className="font-semibold truncate text-sm">{f.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatBytes(f.originalSize)} &rarr; {formatBytes(f.resizedSize!)}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                              if (f.resizedDataUrl) {
                                await sessionStorage.setItem('resize-image-file', f.resizedDataUrl);
                              } else if (f.resizedBlob) {
                                const dataUrl = await blobToDataURL(f.resizedBlob);
                                await sessionStorage.setItem('resize-image-file', dataUrl);
                              }
                              await sessionStorage.setItem('resize-image-filename', f.file.name.replace(/(\\.[^/.]+)/i, `_resized.${outputFormat}`));
                              router.push('/download/resize-image');
                            }}
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button onClick={handleDownloadAll} size="lg" className='w-full h-12 text-base'>
                      <Download className="mr-2 h-5 w-5" />
                      {files.length > 1 ? `Download All (.zip)` : `Download Image`}
                    </Button>
                    <Button onClick={resetFiles} size="lg" variant="outline" className='w-full h-12 text-base'>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Resize More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </aside>
      </div>

      <section className="mt-16 space-y-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">About the Image Resizer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Image Resizer is a powerful and flexible tool for changing the dimensions of your images. Whether you need to fit a photo to specific pixel dimensions for a website banner or scale down a batch of images by a certain percentage, this tool handles it with ease. It's an essential utility for web developers, social media managers, and anyone who needs to prepare images for different platforms.
              <br /><br />
              For even smarter resizing, you can use our AI to suggest common dimensions for use cases like Instagram posts, blog thumbnails, or website heroes. The tool also allows you to maintain the aspect ratio to prevent distortion, ensuring your images always look professional.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">How to Resize an Image</h2>
            <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Upload Your Image(s):</span> Start by dragging and dropping or selecting one or more images from your device.</li>
              <li><span className="font-semibold text-foreground">Choose a Resize Mode:</span> Select whether you want to resize by "Pixels" for exact dimensions or by "Percentage" for scaling.</li>
              <li><span className="font-semibold text-foreground">Enter Dimensions:</span> Input your desired width and height, or the percentage to scale. Keep the aspect ratio locked to avoid stretching. For a smart suggestion, use the AI Smart Resize feature.</li>
              <li><span className="font-semibold text-foreground">Select Output Options:</span> Choose your final format (JPEG, PNG, or WEBP) and adjust the quality for JPEG/WEBP to optimize file size.</li>
              <li><span className="font-semibold text-foreground">Resize and Download:</span> Click "Resize Image(s)" to process your files. Once complete, you can download them individually or as a single ZIP file.</li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Flexible Resizing:</span> Resize by specific pixel dimensions or a relative percentage.</div></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">AI Dimension Suggestions:</span> Get smart recommendations for common use cases like social media or blogs.</div></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Aspect Ratio Lock:</span> Prevent image distortion by keeping the aspect ratio locked while resizing.</div></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Batch Processing:</span> Resize multiple images at once to save time and ensure consistency.</div></li>
              <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Format Conversion:</span> Change the image format and adjust quality during the resizing process.</div></li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Does resizing an image reduce its quality?</AccordionTrigger>
                <AccordionContent>Reducing an image's size (downscaling) generally preserves quality well. Increasing an image's size (upscaling) can lead to a loss of sharpness. For upscaling, we recommend using our dedicated <a href="/tools/image-upscaler" className="text-primary underline">AI Image Upscaler</a> for the best results.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What's the difference between resizing and compressing?</AccordionTrigger>
                <AccordionContent>Resizing changes the dimensions (width and height) of an image. Compressing reduces the file size (in KB or MB) by optimizing the image data, usually without changing the dimensions. You can often do both for maximum optimization.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I make an image larger with this tool?</AccordionTrigger>
                <AccordionContent>Yes, you can enter dimensions larger than the original. However, this may result in a loss of quality. For best results when making images larger, we recommend using our AI Image Upscaler tool.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      <RelatedTools tools={relatedTools} />
    </div>
  );
}

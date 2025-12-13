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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { suggestJpgQuality } from '@/ai/flows/suggest-jpg-quality-flow';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';

type ImageFile = {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  originalType: string;
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  convertedDataUrl?: string;
  convertedSize: number | null;
  isConverting: boolean;
  isConverted: boolean;
};

export default function ConvertToJpgClient() {
  const router = useRouter();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [quality, setQuality] = useState(90);
  const [useAiQuality, setUseAiQuality] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any) as any;

  const toolPath = '/tools/convert-to-jpg';
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
      title: 'Convert to JPG',
      text: 'Check out this Convert to JPG tool!',
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

    const supportedTypes = ['image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/jpeg'];
    const newImageFiles: ImageFile[] = Array.from(incomingFiles)
      .filter(file => supportedTypes.includes(file.type))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        originalType: file.type.split('/')[1].toUpperCase(),
        convertedUrl: null,
        convertedBlob: null,
        convertedSize: null,
        isConverting: false,
        isConverted: false,
      }));

    const unsupportedCount = incomingFiles.length - newImageFiles.length;
    if (unsupportedCount > 0) {
      toast({ title: 'Some files were skipped', description: `${unsupportedCount} file(s) had unsupported formats.` });
    }

    setFiles(prev => {
      const updatedFiles = [...prev, ...newImageFiles];
      if (!activeImageId && updatedFiles.length > 0) {
        setActiveImageId(updatedFiles[0].id);
      }
      return updatedFiles;
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
      const remainingFiles = prev.filter(f => f.id !== id);
      if (activeImageId === id) {
        setActiveImageId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
      }
      return remainingFiles;
    });
  };

  const resetAll = () => {
    files.forEach(f => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
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

        // Draw a white background for transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', quality / 100);
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
          convertedDataUrl,
          convertedSize: blob.size,
        };
        setFiles(prev => prev.map(f => f.id === fileToConvert.id ? updatedFile : f));
        resolvePromise(updatedFile);
      } catch (error) {
        toast({ title: 'Conversion failed', variant: 'destructive' });
        setFiles(prev => prev.map(f => f.id === fileToConvert.id ? { ...f, isConverting: false } : f));
        resolvePromise(null);
      }
    });
  }, [quality, toast]);

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
        sessionStorage.setItem('convert-to-jpg-file', file.convertedDataUrl);
        sessionStorage.setItem('convert-to-jpg-filename', file.file.name.replace(/\.[^/.]+$/, ".jpg"));
        sessionStorage.setItem('return-url', window.location.pathname);
        router.push('/download/convert-to-jpg');
      } else {
        toast({ title: "Error", description: "Could not prepare file for download.", variant: "destructive" });
      }
    } else {
      const zip = new JSZip();
      for (const file of successfulConversions) {
        if (file.convertedBlob) {
          zip.file(file.file.name.replace(/\.[^/.]+$/, ".jpg"), file.convertedBlob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const dataUrl = await blobToDataURL(zipBlob);
      await sessionStorage.setItem('convert-to-jpg-file', dataUrl);
      await sessionStorage.setItem('convert-to-jpg-filename', "proshot-ai-converted-jpg.zip");
      sessionStorage.setItem('return-url', window.location.pathname);
      router.push('/download/convert-to-jpg');
    }
  }, [files, convertSingleImage, router, toast]);

  const handleAiQualityToggle = useCallback(async (checked: boolean) => {
    setUseAiQuality(checked);
    if (!checked || !activeImage) return;

    setIsAiLoading(true);
    try {
      const { quality: suggestedQuality } = await suggestJpgQuality({ photoDataUri: activeImage.originalUrl });
      setQuality(suggestedQuality);
      toast({ title: "AI Suggestion Applied", description: `Optimal quality set to ${suggestedQuality}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "AI Suggestion Failed", variant: "destructive" });
      setUseAiQuality(false);
    } finally {
      setIsAiLoading(false);
    }
  }, [activeImage, toast]);

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
        if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
      });
    }
  }, [files]);

  const relatedTools = ['/tools/convert-from-jpg', '/tools/compress-image'];

  const features = [
    { title: 'Wide Format Support', description: 'Convert PNG, WEBP, GIF, BMP, and TIFF to JPG.' },
    { title: 'AI Quality Suggestion', description: 'Let our AI intelligently recommend the best quality setting to balance size and clarity.' },
    { title: 'Manual Quality Control', description: 'Fine-tune the compression level with a simple slider for full control.' },
    { title: 'Batch Processing', description: 'Upload and convert multiple images at once, saving you time.' },
  ];

  const steps = [
    { title: 'Upload Your Images', description: 'Drag and drop or select your image files (PNG, WEBP, GIF, etc.).' },
    { title: 'Adjust Quality Settings', description: 'Use the slider to set your desired JPG quality. For an optimal balance, you can toggle the "AI Quality Suggestion" to let our AI choose the best setting for you.' },
    { title: 'Start Conversion', description: 'Click the "Convert Image(s)" button to begin processing all your files.' },
    { title: 'Download Your JPGs', description: 'Once converted, your new JPG files will be ready. Download them individually or as a single ZIP archive for multiple files.' },
  ];

  const faqs = [
    { question: 'Why should I convert my images to JPG?', answer: 'JPG is one of the most widely supported image formats, making it great for compatibility. It also offers excellent compression, which is ideal for reducing file sizes for web use, emails, and storage.' },
    { question: 'What happens to the transparency in my PNG files?', answer: 'The JPG format does not support transparency. When you convert a PNG with a transparent background, the transparent areas will be filled with a solid white color in the final JPG image.' },
    { question: 'How does the "AI Quality Suggestion" work?', answer: 'Our AI analyzes the content of your image (e.g., details, colors, text) and suggests a quality setting that provides good compression while preserving important visual details, giving you an optimal result automatically.' },
  ];

  return (
    <ToolPageLayout
      title="Convert Images to JPG Online"
      description="Easily transform your PNG, WEBP, GIF, or other image formats into high-quality JPG files. Use our AI to suggest the best quality settings for optimal results."
      toolName="Convert to JPG"
      category="Image"
      features={features}
      steps={steps}
      faqs={faqs}
      relatedTools={relatedTools}
      aboutTitle="About the JPG Converter"
      aboutDescription={
        <>
          Our Image to JPG Converter is a versatile tool for standardizing your image files. It allows you to convert various formats like PNG, WEBP, GIF, and BMP into the universally compatible JPG format. This is perfect for ensuring your images can be viewed anywhere, reducing file sizes from formats like PNG, and preparing photos for web use where JPG is often the preferred format.
          <br /><br />
          You have full control over the output quality, letting you find the perfect balance between file size and image clarity. For an even smarter approach, our AI can suggest the optimal quality setting for each image, helping you achieve the best compression without a noticeable loss in visual fidelity.
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <main>
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
              <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/png,image/webp,image/gif,image/bmp,image/tiff,image/jpeg" multiple />
              <CardContent className="p-6 text-center w-full">
                <div className="border-2 border-dashed rounded-xl p-12 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleUploadClick}>
                  <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Drag & drop your images here</h3>
                  <p className="text-muted-foreground mt-2">or</p>
                  <Button className="mt-4 pointer-events-none">
                    <Upload className="mr-2 h-4 w-4" /> Select Images
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">Supports PNG, WEBP, GIF, BMP, TIFF</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
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
                          <X className="h-4 w-4" />
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
            </div>
          )}
        </main>

        <aside className="lg:sticky lg:top-24 self-start space-y-6">
          {files.length > 0 && (
            allFilesConverted ? (
              <Card>
                <CardHeader>
                  <CardTitle className='text-2xl'>Results</CardTitle>
                  <CardDescription>All images have been converted to JPG.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {files.map(f => (
                      f.isConverted && f.convertedUrl && <div key={f.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                        <div className="truncate pr-2">
                          <p className='font-medium truncate'>{f.file.name.replace(/\.[^/.]+$/, "") + ".jpg"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(f.originalSize)} &rarr; {formatBytes(f.convertedSize || 0)}
                            ({(((f.originalSize - (f.convertedSize || 0)) / f.originalSize) * 100).toFixed(0)}% smaller)
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" asChild>
                          <a href={f.convertedUrl} download={f.file.name.replace(/\.[^/.]+$/, "") + ".jpg"}>
                            <FileDown className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button onClick={convertAllAndDownload} size="lg" className='w-full h-12 text-base'>
                      <Download className="mr-2 h-5 w-5" />
                      {files.length > 1 ? `Download All (.zip)` : `Download JPG`}
                    </Button>
                    <Button onClick={resetAll} size="lg" variant="outline" className='w-full h-12 text-base'>Start New</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className='text-2xl'>Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        <Label htmlFor="ai-quality" className="font-semibold">AI Quality Suggestion</Label>
                      </div>
                      <Switch id="ai-quality" checked={useAiQuality} onCheckedChange={handleAiQualityToggle} disabled={!activeImage || isAiLoading} />
                    </div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="quality">JPG Quality</Label>
                      <span className="text-sm font-medium">{quality}</span>
                    </div>
                    <Slider id="quality" value={[quality]} onValueChange={(val) => setQuality(val[0])} max={100} step={1} disabled={!activeImage || isProcessingAll || useAiQuality} />
                    <p className='text-xs text-muted-foreground text-center'>Lower quality means smaller file size.</p>
                  </div>

                  <Button onClick={convertAllAndDownload} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                    {isProcessingAll ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Converting...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-5 w-5" />{`Convert ${files.length > 0 ? `(${files.length})` : ''} Image(s)`}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
        </aside>
      </div>
    </ToolPageLayout>
  );
}


'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, X, PlusCircle, FileDown, Layers, Text, Image as ImageLucide, RefreshCw, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Bookmark, Share2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


type ImageFile = {
  id: string;
  file: File;
  originalUrl: string;
  watermarkedUrl: string | null;
  watermarkedBlob: Blob | null;
  watermarkedDataUrl?: string;
  isProcessing: boolean;
  isProcessed: boolean;
};

type WatermarkType = 'text' | 'image';
type Position = 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'center' | 'centerRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

const orderedPositions: Position[] = [
  'topLeft', 'topCenter', 'topRight',
  'centerLeft', 'center', 'centerRight',
  'bottomLeft', 'bottomCenter', 'bottomRight'
];

const positionIcons: { [key in Position]: React.ElementType } = {
  topLeft: AlignStartVertical,
  topCenter: AlignCenterVertical,
  topRight: AlignEndVertical,
  centerLeft: AlignStartHorizontal,
  center: AlignCenterHorizontal,
  centerRight: AlignEndHorizontal,
  bottomLeft: AlignStartVertical,
  bottomCenter: AlignCenterVertical,
  bottomRight: AlignEndVertical,
};

export default function WatermarkImagePage() {
  const router = useRouter();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [view, setView] = useState<'settings' | 'results'>('settings');
  
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [text, setText] = useState('DoreX Ai');
  const [textColor, setTextColor] = useState('#ffffff');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<Position>('center');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(5);
  const [isTiled, setIsTiled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userDocRef!);

  const toolPath = '/tools/watermark-image';
  const isFavorite = userProfile?.favoriteTools?.includes(toolPath);


  const activeImage = useMemo(() => files.find(f => f.id === activeImageId) || null, [files, activeImageId]);
  const allFilesProcessed = files.length > 0 && files.every(f => f.isProcessed);

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
      title: 'Image Watermarker',
      text: 'Check out this Image Watermarker tool!',
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
    if (!incomingFiles) return;

    const newImageFiles: ImageFile[] = Array.from(incomingFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        originalUrl: URL.createObjectURL(file),
        watermarkedUrl: null,
        watermarkedBlob: null,
        isProcessing: false,
        isProcessed: false,
      }));
    
    if (newImageFiles.length !== incomingFiles.length) {
      toast({ title: 'Some files were skipped', description: 'Only image files are supported.' });
    }
    
    setFiles(prev => {
        const updatedFiles = [...prev, ...newImageFiles];
        if(!activeImageId && updatedFiles.length > 0) {
            setActiveImageId(updatedFiles[0].id);
        }
        return updatedFiles;
    });
    setView('settings');
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setWatermarkImage(e.target?.result as string);
        reader.readAsDataURL(file);
    } else {
        toast({ title: 'Invalid File', description: 'Please select an image file for the watermark.', variant: 'destructive'});
    }
  }

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
      if (f.watermarkedUrl) URL.revokeObjectURL(f.watermarkedUrl);
    });
    setFiles([]);
    setActiveImageId(null);
    setIsProcessingAll(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
  
  const getCoordinates = (pos: Position, width: number, height: number): { x: number, y: number } => {
      const margin = width * 0.05;
      const positions = {
          topLeft: { x: margin, y: margin },
          topCenter: { x: width / 2, y: margin },
          topRight: { x: width - margin, y: margin },
          centerLeft: { x: margin, y: height / 2 },
          center: { x: width / 2, y: height / 2 },
          centerRight: { x: width - margin, y: height / 2 },
          bottomLeft: { x: margin, y: height - margin },
          bottomCenter: { x: width / 2, y: height - margin },
          bottomRight: { x: width - margin, y: height - margin }
      };
      return positions[pos];
  }

  const processSingleImage = async (id: string): Promise<ImageFile | null> => {
    const fileToProcess = files.find(f => f.id === id);
    if (!fileToProcess) return null;

    if (watermarkType === 'image' && !watermarkImage) {
        toast({ title: 'Watermark Image Needed', description: 'Please upload an image to use as a watermark.', variant: 'destructive' });
        return null;
    }

    setFiles(prev => prev.map(f => f.id === id ? { ...f, isProcessing: true } : f));

    const mainImage = await new Promise<HTMLImageElement>(resolve => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.src = fileToProcess.originalUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(mainImage, 0, 0);

    ctx.globalAlpha = opacity / 100;

    const watermarkImageElement = watermarkType === 'image' && watermarkImage ? await new Promise<HTMLImageElement>(resolve => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.src = watermarkImage;
    }) : null;
    
    const applyWatermark = (x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);
        if (watermarkType === 'text') {
            const fontSize = canvas.width * (scale / 100);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);
        } else if (watermarkImageElement) {
            const wmWidth = mainImage.width * (scale / 100);
            const wmHeight = watermarkImageElement.height * (wmWidth / watermarkImageElement.width);
            ctx.drawImage(watermarkImageElement, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
        }
        ctx.restore();
    }
    
    if (isTiled) {
        const stepX = canvas.width / 5;
        const stepY = canvas.height / 5;
        for (let y = stepY / 2; y < canvas.height; y += stepY) {
            for (let x = stepX / 2; x < canvas.width; x += stepX) {
                applyWatermark(x, y);
            }
        }
    } else {
        const { x, y } = getCoordinates(position, canvas.width, canvas.height);
        applyWatermark(x, y);
    }
    
    const blob = await new Promise<Blob|null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return null;

    const watermarkedDataUrl = await blobToDataURL(blob);

    const updatedFile: ImageFile = {
      ...fileToProcess,
      isProcessing: false,
      isProcessed: true,
      watermarkedUrl: URL.createObjectURL(blob),
      watermarkedBlob: blob,
      watermarkedDataUrl,
    };

    setFiles(prev => prev.map(f => f.id === id ? updatedFile : f));
    return updatedFile;
  };
  
  const processAll = async () => {
    setIsProcessingAll(true);
    await Promise.all(files.map(file => processSingleImage(file.id)));
    setIsProcessingAll(false);
    toast({ title: 'All images watermarked!' });
    setView('results');
  };
  
  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.isProcessed && f.watermarkedBlob);
    if (filesToDownload.length === 0) return;

    if (filesToDownload.length === 1 && filesToDownload[0].watermarkedDataUrl) {
        await sessionStorage.setItem('watermark-image-file', filesToDownload[0].watermarkedDataUrl);
        await sessionStorage.setItem('watermark-image-filename', filesToDownload[0].file.name.replace(/(\\.[^/.]+)/i, `_watermarked.jpg`));
        router.push('/download/watermark-image');
    } else {
        const zip = new JSZip();
        for (const file of filesToDownload) {
            if (file.watermarkedBlob) {
              zip.file(file.file.name.replace(/(\\.[^/.]+)/i, `_watermarked.jpg`), file.watermarkedBlob);
            }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const dataUrl = await blobToDataURL(zipBlob);
        await sessionStorage.setItem('watermark-image-file', dataUrl);
        await sessionStorage.setItem('watermark-image-filename', `dorex-ai-watermarked-images.zip`);
        router.push('/download/watermark-image');
    }
  };

  useEffect(() => {
    return () => {
      files.forEach(f => {
        if(f.originalUrl) URL.revokeObjectURL(f.originalUrl);
        if (f.watermarkedUrl) URL.revokeObjectURL(f.watermarkedUrl);
      });
    }
  }, [files]);
  
  const relatedTools = tools.filter(tool => ['/tools/compress-image', '/tools/blur-faces'].includes(tool.path));

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
            <BreadcrumbItem><BreadcrumbPage>Watermark Image</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Add Watermark to Images Online</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Easily apply a custom text or image watermark to your photos. Protect your work by adjusting opacity, position, size, and rotation.
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

      {files.length === 0 ? (
        <Card 
            className={cn('w-full max-w-2xl mx-auto flex items-center justify-center transition-colors', isDragging ? 'bg-primary/10 border-primary' : 'bg-transparent')}
            onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
            <CardContent className="p-6 text-center w-full">
              <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Drag & drop your images here</h3>
                  <p className="text-muted-foreground mt-2">or</p>
                  <Button className="mt-4 pointer-events-none">
                      <Upload className="mr-2 h-4 w-4" /> Select Images
                  </Button>
              </div>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            <div className="space-y-4">
              <Card className='w-full aspect-video flex items-center justify-center overflow-hidden relative bg-muted/30'>
                  {activeImage ? (
                    <div className="relative w-full h-full">
                      <Image src={view === 'results' && activeImage.watermarkedUrl ? activeImage.watermarkedUrl : activeImage.originalUrl} alt="Preview" layout="fill" objectFit="contain" />
                      {(isProcessingAll || activeImage.isProcessing) && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      )}
                      
                       {view === 'settings' && (
                        <div className="absolute inset-0 z-10 pointer-events-none" style={{ opacity: opacity / 100 }}>
                            {isTiled ? (
                                <div className="absolute inset-0" style={{
                                    backgroundImage: watermarkType === 'text' 
                                        ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="150px" width="200px"><text x="100" y="75" font-size="${20}" fill="${textColor.replace('#', '%23')}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotation} 100 75)">${text}</text></svg>')`
                                        : (watermarkImage ? `url(${watermarkImage})` : 'none'),
                                    backgroundRepeat: 'repeat',
                                    backgroundSize: watermarkType === 'image' ? `${scale * 4}%` : 'auto',
                                }}></div>
                            ) : (
                                <div className={cn("absolute flex items-center justify-center p-4", 
                                    position.includes('top') ? 'top-0' : !position.includes('bottom') ? 'top-1/2 -translate-y-1/2' : '',
                                    position.includes('bottom') ? 'bottom-0' : '',
                                    position.includes('Left') ? 'left-0' : !position.includes('Right') ? 'left-1/2 -translate-x-1/2' : '',
                                    position.includes('Right') ? 'right-0' : ''
                                )}>
                                    <div style={{ transform: `rotate(${rotation}deg)`}}>
                                        {watermarkType === 'text' ? (
                                            <span style={{ fontSize: `${scale}vw`, color: textColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>{text}</span>
                                        ) : watermarkImage ? (
                                            <img src={watermarkImage} alt="Watermark" style={{width: `${scale*4}%`}}/>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  ) : (
                      <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">Select an image to start</h3>
                      </div>
                  )}
              </Card>
              <Card>
                  <CardContent className="p-2">
                      <div className="flex gap-2 items-center overflow-x-auto">
                          {files.map(f => (
                              <div key={f.id} className='relative shrink-0'>
                                  <button onClick={() => setActiveImageId(f.id)} className={cn('block w-24 h-16 rounded-md overflow-hidden border-2', activeImageId === f.id ? 'border-primary' : 'border-transparent')}>
                                      <Image src={f.watermarkedUrl || f.originalUrl} alt={f.file.name} width={96} height={64} className="object-cover w-full h-full" />
                                  </button>
                                  <Button variant="destructive" size="icon" onClick={() => removeFile(f.id)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"><X className="h-4 w-4"/></Button>
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
            
            <div className='space-y-6 lg:sticky lg:top-24'>
              {view === 'settings' ? (
              <Card>
                  <CardHeader>
                      <CardTitle className='text-2xl'>Watermark Settings</CardTitle>
                      <CardDescription>Apply a text or image watermark.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <RadioGroup value={watermarkType} onValueChange={(v) => setWatermarkType(v as WatermarkType)} className="grid grid-cols-2 gap-4">
                        <Label htmlFor="text" className="flex flex-col items-center justify-center rounded-md border p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-muted">
                            <RadioGroupItem value="text" id="text" className="sr-only" />
                            <Text className="h-6 w-6 mb-2"/>Text
                        </Label>
                        <Label htmlFor="image" className="flex flex-col items-center justify-center rounded-md border p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-muted">
                            <RadioGroupItem value="image" id="image" className="sr-only" />
                            <ImageLucide className="h-6 w-6 mb-2"/>Image
                        </Label>
                    </RadioGroup>

                    {watermarkType === 'text' ? (
                        <div className="space-y-2">
                            <Label htmlFor="watermark-text">Watermark Text</Label>
                            <div className='flex gap-2'>
                                <Input id="watermark-text" value={text} onChange={(e) => setText(e.target.value)} />
                                <Input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-12 p-1"/>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Watermark Image</Label>
                            <Button variant="outline" className="w-full" onClick={() => watermarkInputRef.current?.click()}>
                                {watermarkImage ? 'Change Watermark' : 'Upload Watermark'}
                            </Button>
                            <input type="file" ref={watermarkInputRef} onChange={handleWatermarkImageUpload} className="hidden" accept="image/png" />
                            {watermarkImage && <div className="p-2 border rounded-md"><Image src={watermarkImage} alt="Watermark preview" width={100} height={100} className="mx-auto object-contain" /></div>}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label>Position</Label>
                         <div className="grid grid-cols-3 gap-2">
                            {orderedPositions.map(p => {
                                const Icon = positionIcons[p];
                                let extraClass = '';
                                if (p.includes('Right')) extraClass = 'transform rotate-90';
                                if (p.includes('Left')) extraClass = 'transform -rotate-90';
                                if (p.includes('bottom')) extraClass = 'transform rotate-180';
                                return (
                                    <Button key={p} variant={position === p ? 'secondary' : 'outline'} size="icon" onClick={() => setPosition(p)} disabled={isTiled}>
                                        <Icon className={cn("h-5 w-5", extraClass)} />
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Opacity ({opacity}%)</Label>
                      <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} />
                    </div>
                     <div className="space-y-2">
                      <Label>Size ({scale})</Label>
                      <Slider value={[scale]} onValueChange={([v]) => setScale(v)} min={1} max={50}/>
                    </div>
                    <div className="space-y-2">
                      <Label>Rotation ({rotation}°)</Label>
                      <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={-180} max={180}/>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="tile-watermark" checked={isTiled} onChange={(e) => setIsTiled(e.target.checked)} />
                        <Label htmlFor="tile-watermark">Tile Watermark</Label>
                    </div>

                    <Button onClick={processAll} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                      {isProcessingAll ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                      ) : (
                          <><RefreshCw className="mr-2 h-5 w-5" />{`Add Watermark to ${files.length} Image(s)`}</>
                      )}
                    </Button>
                  </CardContent>
              </Card>
              ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                            Your watermarked images are ready.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                {files.filter(f => f.isProcessed).map(f => (
                                    <Card key={f.id} className="p-3">
                                        <div className="flex items-center gap-4">
                                            <Image src={f.watermarkedUrl!} alt={f.file.name} width={40} height={40} className="rounded-md aspect-square object-cover" />
                                            <div className="flex-1 truncate">
                                                <p className="font-semibold truncate text-sm">{f.file.name}</p>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (f.watermarkedDataUrl) {
                                                        sessionStorage.setItem('watermark-image-file', f.watermarkedDataUrl);
                                                        sessionStorage.setItem('watermark-image-filename', f.file.name.replace(/(\\.[^/.]+)/i, `_watermarked.jpg`));
                                                        router.push('/download/watermark-image');
                                                    }
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
                            <Button onClick={resetAll} size="lg" variant="outline" className='w-full h-12 text-base'>
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Start New
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              )}
            </div>
        </div>
      )}
       <section className="mt-16 space-y-8">
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">About the Watermark Tool</h2>
                      <p className="text-muted-foreground leading-relaxed">
                          Protect your creative work and brand your images with our flexible Watermark tool. This feature allows you to easily add a text or image watermark to your photos before sharing them online. It's an essential step for photographers, artists, and businesses who want to prevent unauthorized use of their images and increase brand visibility.
                          <br /><br />
                          You have complete control over the appearance of your watermark. Adjust the opacity for a subtle effect, change the size and rotation, and place it in one of nine positions or tile it across the entire image for maximum protection.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">How to Watermark an Image</h2>
                    <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                        <li><span className="font-semibold text-foreground">Upload Your Image(s):</span> Drag and drop your images or select them from your device.</li>
                        <li><span className="font-semibold text-foreground">Choose Watermark Type:</span> Select whether you want to add a text watermark or an image (logo) watermark.</li>
                        <li><span className="font-semibold text-foreground">Customize Your Watermark:</span> Enter your text or upload your logo. Use the sliders and position grid to adjust the opacity, size, rotation, and placement. Select "Tile Watermark" for full coverage.</li>
                        <li><span className="font-semibold text-foreground">Apply and Download:</span> Click "Add Watermark" to process your images. Once done, you can download your protected photos.</li>
                    </ol>
                  </CardContent>
              </Card>
               <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                      <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Text and Image Watermarks:</span> Use your brand name, URL, or logo as a watermark.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Full Customization:</span> Control opacity, size, rotation, and position to get the exact look you want.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Tiling Option:</span> Repeat your watermark across the entire image for maximum protection against cropping.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Batch Processing:</span> Apply the same watermark to multiple images simultaneously.</div></li>
                      </ul>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What's the best image format for a logo watermark?</AccordionTrigger>
                            <AccordionContent>A PNG file with a transparent background is ideal for a logo watermark, as it will blend seamlessly with your main image without a solid color box around it.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Will adding a watermark reduce the quality of my image?</AccordionTrigger>
                            <AccordionContent>The watermarking process itself does not reduce quality. The final output is saved as a high-quality JPEG, so there may be some compression, but it is generally not noticeable.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Can the watermark be removed later?</AccordionTrigger>
                            <AccordionContent>Once the watermark is applied and the image is downloaded, it is permanently part of the image and cannot be easily removed. Be sure you are happy with the preview before processing.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </CardContent>
              </Card>
          </section>

      <RelatedTools tools={relatedTools} />
    </div>
  );
}


'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Download, ImageIcon, Loader2, X, PlusCircle, FileDown,
  Scissors, RotateCcw, RotateCw, RefreshCw, Bookmark, Share2, FlipHorizontal, FlipVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type Crop = { x: number; y: number; width: number; height: number };
type DragHandle = 'topLeft' | 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'move';

type ImageFile = {
  id: string;
  file: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  croppedUrl: string | null;
  croppedBlob: Blob | null;
  croppedDataUrl?: string;
  isCropping: boolean;
  isCropped: boolean;
  crop: Crop;
  rotation: number;
  flip: { horizontal: boolean, vertical: boolean };
  aspect?: number;
};

type OutputFormat = 'jpeg' | 'png' | 'webp';

const aspectRatios = [
    { name: 'Freeform', value: undefined },
    { name: '1:1 (Square)', value: 1 },
    { name: '4:3 (Standard)', value: 4/3 },
    { name: '3:4 (Portrait)', value: 3/4 },
    { name: '16:9 (Widescreen)', value: 16/9 },
    { name: '9:16 (Story)', value: 9/16 },
]


export default function CropImagePage() {
  const router = useRouter();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(90);

  const [view, setView] = useState<'settings' | 'results'>('settings');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<DragHandle | null>(null);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 });
  
  const { toast } = useToast();
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userDocRef!);
  
  const toolPath = '/tools/crop-image';
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
      title: 'Online Image Cropper',
      text: 'Check out this online Image Cropper tool!',
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

  const updateFileState = (id: string, updates: Partial<ImageFile>) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newImageFilePromises: Promise<ImageFile>[] = Array.from(incomingFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
          return new Promise((resolve) => {
              const originalUrl = URL.createObjectURL(file);
              const img = document.createElement('img');
              img.onload = () => {
                  resolve({
                      id: `${file.name}-${file.lastModified}-${Math.random()}`,
                      file,
                      originalUrl,
                      originalWidth: img.width,
                      originalHeight: img.height,
                      croppedUrl: null,
                      croppedBlob: null,
                      isCropping: false,
                      isCropped: false,
                      crop: { x: 10, y: 10, width: 80, height: 80 },
                      rotation: 0,
                      flip: { horizontal: false, vertical: false },
                      aspect: undefined,
                  });
              };
              img.src = originalUrl;
          });
      });
      
    Promise.all(newImageFilePromises).then(results => {
        if (results.length !== incomingFiles.length) {
          toast({ title: 'Some files were skipped', description: 'Only image files are supported.' });
        }
        setFiles(prev => {
            const updatedFiles = [...prev, ...results];
            if(!activeImageId && updatedFiles.length > 0) {
                setActiveImageId(updatedFiles[0].id);
            }
            return updatedFiles;
        });
        setView('settings');
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
        URL.revokeObjectURL(f.originalUrl);
        if (f.croppedUrl) URL.revokeObjectURL(f.croppedUrl);
    });
    setFiles([]);
    setActiveImageId(null);
    setIsProcessingAll(false);
    setView('settings');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, crop: Crop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const rotRad = rotation * Math.PI / 180;
    
    const sin = Math.abs(Math.sin(rotRad));
    const cos = Math.abs(Math.cos(rotRad));
    const newWidth = image.width * cos + image.height * sin;
    const newHeight = image.width * sin + image.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    const rotatedImage = await createImage(canvas.toDataURL());

    const cropX = (crop.x / 100) * rotatedImage.width;
    const cropY = (crop.y / 100) * rotatedImage.height;
    const cropWidth = (crop.width / 100) * rotatedImage.width;
    const cropHeight = (crop.height / 100) * rotatedImage.height;

    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return null;

    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;

    cropCtx.drawImage(
      rotatedImage,
      cropX, cropY,
      cropWidth, cropHeight,
      0, 0,
      cropWidth, cropHeight
    );
    
    return new Promise<Blob | null>((resolve) => {
        cropCanvas.toBlob(resolve, `image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100);
    });
  };

  const blobToDataURL = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  };

  const cropSingleImage = async (id: string) => {
    const fileToCrop = files.find(f => f.id === id);
    if (!fileToCrop) return;

    updateFileState(id, { isCropping: true });
    
    try {
      const blob = await getCroppedImg(fileToCrop.originalUrl, fileToCrop.crop, fileToCrop.rotation, fileToCrop.flip);
      if (!blob) throw new Error('Blob creation failed');

      const croppedUrl = URL.createObjectURL(blob);
      const croppedDataUrl = await blobToDataURL(blob);

      updateFileState(id, {
        isCropping: false,
        isCropped: true,
        croppedUrl,
        croppedBlob: blob,
        croppedDataUrl
      });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error cropping image', variant: 'destructive' });
      updateFileState(id, { isCropping: false });
    }
  };

  const cropAll = async () => {
    setIsProcessingAll(true);
    for (const file of files) {
        await cropSingleImage(file.id);
    }
    setIsProcessingAll(false);
    toast({ title: 'All images cropped!', description: 'Ready for download.' });
    setView('results');
  };
  
  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.isCropped && f.croppedBlob);
    if(filesToDownload.length === 0) return;
    
    if (filesToDownload.length === 1 && filesToDownload[0].croppedDataUrl) {
        sessionStorage.setItem('crop-image-file', filesToDownload[0].croppedDataUrl);
        sessionStorage.setItem('crop-image-filename', filesToDownload[0].file.name.replace(/(\\.[^/.]+)/i, `_cropped.${outputFormat}`));
        router.push('/download/crop-image');
    } else {
        const zip = new JSZip();
        for (const file of filesToDownload) {
            if (file.croppedBlob) {
              zip.file(file.file.name.replace(/(\\.[^/.]+)/i, `_cropped.${outputFormat}`), file.croppedBlob);
            }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const dataUrl = await blobToDataURL(zipBlob);
        sessionStorage.setItem('crop-image-file', dataUrl);
        sessionStorage.setItem('crop-image-filename', 'dorex-ai-cropped-images.zip');
        router.push('/download/crop-image');
    }
  };

  useEffect(() => {
    return () => {
      files.forEach(f => {
        URL.revokeObjectURL(f.originalUrl);
        if (f.croppedUrl) URL.revokeObjectURL(f.croppedUrl);
      });
    }
  }, [files]);
  
    const onMouseDown = (e: React.MouseEvent | React.TouchEvent, handle: DragHandle) => {
      if (!activeImage || !imageContainerRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      
      setDraggingHandle(handle);
      const rect = imageContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setStartDragPos({ x: clientX, y: clientY });
      setStartCrop(activeImage.crop);
  };

  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!draggingHandle || !imageContainerRef.current || !activeImage) return;
      
      const rect = imageContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = ((clientX - startDragPos.x) / rect.width) * 100;
      const dy = ((clientY - startDragPos.y) / rect.height) * 100;

      let {x, y, width, height} = startCrop;
      const { aspect } = activeImage;

      if (draggingHandle === 'move') {
          x += dx;
          y += dy;
      } else {
        if(draggingHandle.includes('Left')) { x = startCrop.x + dx; width = startCrop.width - dx; }
        if(draggingHandle.includes('Right')) width = startCrop.width + dx;
        if(draggingHandle.includes('top')) { y = startCrop.y + dy; height = startCrop.height - dy; }
        if(draggingHandle.includes('bottom')) height = startCrop.height + dy;
          
        if (aspect) {
            if (draggingHandle.includes('Left') || draggingHandle.includes('Right')) {
              height = width / aspect;
            } else {
              width = height * aspect;
            }
            if (draggingHandle.includes('top')) {
                y = startCrop.y + startCrop.height - height;
            }
             if (draggingHandle.includes('Left')) {
                x = startCrop.x + startCrop.width - width;
            }
        }
      }

      width = Math.max(5, Math.min(width, 100));
      height = Math.max(5, Math.min(height, 100));
      x = Math.max(0, Math.min(x, 100 - width));
      y = Math.max(0, Math.min(y, 100 - height));
      
      updateFileState(activeImage.id, { crop: { x, y, width, height } });

  }, [draggingHandle, startDragPos, startCrop, activeImage]);

  const onMouseUp = useCallback(() => {
      setDraggingHandle(null);
  }, []);
  
  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);


  const handleSetAspect = (newAspect: number | undefined) => {
      if (!activeImage) return;
      
      const cropToAdjust = activeImage.crop;
      
      let newCrop = { ...cropToAdjust };
      
      if (newAspect) {
          const center = { x: cropToAdjust.x + cropToAdjust.width / 2, y: cropToAdjust.y + cropToAdjust.height / 2 };
          let newWidth = cropToAdjust.width;
          let newHeight = newWidth / newAspect;

          if (newHeight > 100) {
              newHeight = 100;
              newWidth = newHeight * newAspect;
          }
          if (newWidth > 100) {
              newWidth = 100;
              newHeight = newWidth / newAspect;
          }

          let newX = center.x - newWidth / 2;
          let newY = center.y - newHeight / 2;

          newX = Math.max(0, Math.min(newX, 100 - newWidth));
          newY = Math.max(0, Math.min(newY, 100 - newHeight));
          
          newCrop = { x: newX, y: newY, width: newWidth, height: newHeight };
      }
      
      updateFileState(activeImage.id, { aspect: newAspect, crop: newCrop });
  }

  const relatedTools = tools.filter(tool => ['/tools/resize-image', '/tools/rotate-image'].includes(tool.path));


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
            <BreadcrumbItem><BreadcrumbPage>Crop Image</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free Online Image Cropper</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Easily crop, rotate, and frame your images online. Choose from popular aspect ratios for the perfect composition.
        </p>
      </div>
       <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
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
                    <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
                    <CardContent className="p-6 text-center w-full">
                    <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                        <Scissors className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
                        <p className="text-muted-foreground mt-2">or</p>
                        <Button className="mt-4 pointer-events-none">
                            <Upload className="mr-2 h-4 w-4" />
                            Select Image
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card className='w-full aspect-video flex items-center justify-center overflow-hidden bg-muted/30'>
                        {activeImage ? (
                            <div ref={imageContainerRef} className="relative w-full h-full touch-none select-none">
                                {view === 'results' && activeImage.isCropped && activeImage.croppedUrl ? (
                                    <ReactCompareSlider
                                        itemOne={<ReactCompareSliderImage src={activeImage.originalUrl} alt="Original" />}
                                        itemTwo={<ReactCompareSliderImage src={activeImage.croppedUrl} alt="Cropped" />}
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <>
                                        <Image src={activeImage.originalUrl} alt="Preview" layout="fill" objectFit="contain" className="transition-transform duration-300" style={{ transform: `rotate(${activeImage.rotation}deg) scaleX(${activeImage.flip.horizontal ? -1 : 1}) scaleY(${activeImage.flip.vertical ? -1 : 1})` }} />
                                        {/* Dark overlay */}
                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                            <div className="absolute bg-black/50" style={{ top: 0, left: 0, right: 0, height: `${activeImage.crop.y}%` }} />
                                            <div className="absolute bg-black/50" style={{ bottom: 0, left: 0, right: 0, height: `${100 - (activeImage.crop.y + activeImage.crop.height)}%` }} />
                                            <div className="absolute bg-black/50" style={{ top: `${activeImage.crop.y}%`, left: 0, width: `${activeImage.crop.x}%`, height: `${activeImage.crop.height}%` }} />
                                            <div className="absolute bg-black/50" style={{ top: `${activeImage.crop.y}%`, right: 0, width: `${100 - (activeImage.crop.x + activeImage.crop.width)}%`, height: `${activeImage.crop.height}%` }} />
                                        </div>
                                        {/* Crop box */}
                                        <div className="absolute z-20 border-2 border-dashed border-white" style={{ 
                                            left: `${activeImage.crop.x}%`, top: `${activeImage.crop.y}%`, width: `${activeImage.crop.width}%`, height: `${activeImage.crop.height}%`,
                                            cursor: draggingHandle ? 'grabbing' : 'move',
                                        }}
                                        onMouseDown={(e) => onMouseDown(e, 'move')}
                                        onTouchStart={(e) => onMouseDown(e, 'move')}
                                        >
                                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                                                {[...Array(9)].map((_, i) => <div key={i} className="border border-white/30" />)}
                                            </div>
                                            {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'top', 'bottom', 'left', 'right'] as const).map(handle => {
                                                const handleStyle: React.CSSProperties = {};
                                                if (handle.includes('top')) { handleStyle.top = '-6px'; }
                                                if (handle.includes('bottom')) { handleStyle.bottom = '-6px'; }
                                                if (handle.includes('left')) { handleStyle.left = '-6px'; }
                                                if (handle.includes('right')) { handleStyle.right = '-6px'; }
                                                if (handle === 'top' || handle === 'bottom') { handleStyle.left = '50%'; handleStyle.transform = 'translateX(-50%)'; handleStyle.cursor = 'ns-resize'; }
                                                if (handle === 'left' || handle === 'right') { handleStyle.top = '50%'; handleStyle.transform = 'translateY(-50%)'; handleStyle.cursor = 'ew-resize'; }
                                                if (handle === 'topLeft') { handleStyle.cursor = 'nwse-resize'; }
                                                if (handle === 'topRight') { handleStyle.cursor = 'nesw-resize'; }
                                                if (handle === 'bottomLeft') { handleStyle.cursor = 'nesw-resize'; }
                                                if (handle === 'bottomRight') { handleStyle.cursor = 'nwse-resize'; }
                                                
                                                return (
                                                    <div key={handle}
                                                        className="absolute w-3 h-3 bg-white rounded-full border border-gray-500 shadow-md"
                                                        style={handleStyle}
                                                        onMouseDown={(e) => onMouseDown(e, handle)}
                                                        onTouchStart={(e) => onMouseDown(e, handle)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">Select an image to crop</h3>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <CardContent className="p-2">
                            <div className="flex gap-2 items-center overflow-x-auto">
                                {files.map(f => (
                                    <div key={f.id} className='relative shrink-0'>
                                        <button onClick={() => setActiveImageId(f.id)} className={cn('block w-24 h-16 rounded-md overflow-hidden border-2', activeImageId === f.id ? 'border-primary' : 'border-transparent')}>
                                            <Image src={f.croppedUrl || f.originalUrl} alt={f.file.name} width={96} height={64} className="object-cover w-full h-full" />
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
                </div>
            )}
        </main>
        
        <aside className='space-y-6 lg:sticky lg:top-24'>
            {files.length > 0 && (
                view === 'settings' ? (
                <Card>
                    <CardHeader><CardTitle className='text-2xl'>Settings</CardTitle></CardHeader>
                    <CardContent className='space-y-6'>
                        <div className='space-y-2'>
                        <Label>Aspect Ratio</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {aspectRatios.map(r => (
                                <Button key={r.name} variant={activeImage?.aspect === r.value ? 'secondary' : 'outline'} onClick={() => handleSetAspect(r.value)}>{r.name}</Button>
                            ))}
                        </div>
                        </div>

                        <div className='space-y-2'>
                        <Label>Transform</Label>
                        <div className='grid grid-cols-2 gap-2'>
                            <Button variant="outline" onClick={() => updateFileState(activeImageId!, { rotation: (activeImage?.rotation || 0) - 90 })}><RotateCcw className="mr-2" /> Rotate Left</Button>
                            <Button variant="outline" onClick={() => updateFileState(activeImageId!, { rotation: (activeImage?.rotation || 0) + 90 })}><RotateCw className="mr-2" /> Rotate Right</Button>
                            <Button variant="outline" onClick={() => updateFileState(activeImageId!, { flip: { ...(activeImage?.flip || { horizontal: false, vertical: false }), horizontal: !activeImage?.flip.horizontal }})}><FlipHorizontal className="mr-2"/> Flip</Button>
                            <Button variant="outline" onClick={() => updateFileState(activeImageId!, { flip: { ...(activeImage?.flip || { horizontal: false, vertical: false }), vertical: !activeImage?.flip.vertical }})}><FlipVertical className="mr-2"/> Flip</Button>
                        </div>
                        </div>
                        
                        <div className='grid grid-cols-2 gap-4'>
                            <div className="space-y-2">
                                <Label>Output Format</Label>
                                <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as OutputFormat)} className="w-full h-10 rounded-md border border-input px-3">
                                    <option value="jpeg">JPEG</option>
                                    <option value="png">PNG</option>
                                    <option value="webp">WEBP</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quality ({quality})</Label>
                                <input type="range" value={quality} onChange={e => setQuality(Number(e.target.value))} disabled={outputFormat === 'png'} className="w-full" />
                            </div>
                        </div>
                        <Button onClick={cropAll} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                            {isProcessingAll ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Cropping...</>
                            ) : (
                                <><Scissors className="mr-2 h-5 w-5" />{`Crop ${files.length > 0 ? `(${files.length})` : ''} Image(s)`}</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Results</CardTitle>
                            <CardDescription>Your cropped images are ready.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                {files.filter(f => f.isCropped).map(f => (
                                    <Card key={f.id} className="p-3">
                                        <div className="flex items-center gap-4">
                                            <Image src={f.croppedUrl!} alt={f.file.name} width={40} height={40} className="rounded-md aspect-square object-cover" />
                                            <div className="flex-1 truncate">
                                                <p className="font-semibold truncate text-sm">{f.file.name}</p>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (f.croppedDataUrl) {
                                                        sessionStorage.setItem('crop-image-file', f.croppedDataUrl);
                                                        sessionStorage.setItem('crop-image-filename', f.file.name.replace(/(\\.[^/.]+)/i, `_cropped.${outputFormat}`));
                                                        router.push('/download/crop-image');
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
                                    Crop More
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </aside>
      </div>
    </div>
  );
}

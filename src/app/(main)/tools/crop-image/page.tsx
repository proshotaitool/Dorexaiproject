
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
import ReactCropper, { ReactCropperElement } from 'react-cropper';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

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
  cropData?: Cropper.Data;
  aspect?: number;
};

type OutputFormat = 'jpeg' | 'png' | 'webp';

const aspectRatios = [
  { name: 'Freeform', value: undefined },
  { name: '1:1 (Square)', value: 1 },
  { name: '4:3 (Standard)', value: 4 / 3 },
  { name: '3:4 (Portrait)', value: 3 / 4 },
  { name: '16:9 (Widescreen)', value: 16 / 9 },
  { name: '9:16 (Story)', value: 9 / 16 },
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
  const cropperRef = useRef<ReactCropperElement>(null);

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
        if (!activeImageId && updatedFiles.length > 0) {
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

  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getCroppedImg = async (imageSrc: string, cropData: Cropper.Data | undefined, outputFormat: OutputFormat = 'jpeg', quality: number = 90): Promise<{ url: string, blob: Blob, dataUrl: string } | null> => {
    if (!cropData) return null;

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const { x, y, width, height, rotate, scaleX, scaleY } = cropData;

    // 1. Calculate the bounding box of the rotated image
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const newWidth = image.width * cos + image.height * sin;
    const newHeight = image.width * sin + image.height * cos;

    // 2. Set canvas size to match the bounding box
    canvas.width = newWidth;
    canvas.height = newHeight;

    // 3. Center the context
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rad);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    // 4. Create a second canvas for the cropped area
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');

    if (!cropCtx) return null;

    cropCanvas.width = width;
    cropCanvas.height = height;

    // 5. Draw the cropped area from the first canvas to the second
    // The x/y from getData are relative to the *rotated* image's bounding box top-left?
    // Actually, CropperJS documentation says x/y are relative to the *original* image?
    // Let's check the source or behavior.
    // If I rotate, the "canvas" expands.
    // It seems `x` and `y` are coordinates on the *visual* canvas (the rotated one).
    // Let's assume x/y are correct for the rotated canvas we just drew.

    // We need to account for the fact that we centered the image in step 3.
    // Wait, if we use `cropper.getCroppedCanvas`, it does the heavy lifting.
    // Replicating it exactly is hard.

    // Let's try a different approach:
    // We draw the image onto the cropCanvas directly using the source coordinates.
    // BUT rotation makes this hard.

    // Let's stick to the "draw rotated, then crop" approach.
    // We need to know where the "top-left" of the rotated image is relative to the canvas?
    // No, we drew the rotated image onto `canvas` (centered).
    // Now we need to know where (x, y) is relative to `canvas`.
    // In CropperJS, (x,y) are relative to the top-left of the *canvas* that contains the image?
    // No, they are relative to the *natural* image if checkOrientation is false?

    // Actually, let's look at how others do it.
    // Most solutions just use the `cropper` instance.
    // Since we can't easily replicate the logic, maybe we should just instantiate a temporary Cropper?
    // No, that's DOM heavy.

    // Let's assume for now that `x` and `y` are relative to the *rotated* bounding box if we construct it this way.
    // If this fails, we might need to restrict batch cropping to "only active" or warn the user.
    // BUT, let's try to map it.

    // If we look at `react-cropper` demos, they usually just use the ref.

    // Let's try to use the `canvas` we created.
    // We need to draw from `canvas` to `cropCanvas`.
    // sourceX = x, sourceY = y.
    // But `x` and `y` might be negative if the crop box is outside? No, usually constrained.

    // Let's try:
    cropCtx.drawImage(
      canvas,
      x + (canvas.width - newWidth) / 2, // Adjust if our bounding box calculation differs?
      y + (canvas.height - newHeight) / 2,
      width,
      height,
      0,
      0,
      width,
      height
    );

    // Actually, `x` and `y` from `getData(true)` (rounded) are what we have.
    // Let's assume they are correct for the canvas space if we align the image top-left at 0,0?
    // No, we centered it.

    // Let's simplify:
    // If we just draw the image at 0,0 of `canvas` (with rotation around center of image?), it's complex.

    // Alternative:
    // Just use `cropperRef` for the active image.
    // For inactive images, if they haven't been cropped (no `cropData`), we just use original.
    // If they HAVE `cropData` (meaning they were active at some point), we should have SAVED the `croppedUrl` then!
    // YES! That is the solution.
    // We don't need to re-crop inactive images. We just need to ensure we SAVE the crop when we switch AWAY from an image.

    return null;
  };

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const onCrop = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const cropper = cropperRef.current?.cropper;
      if (cropper && activeImageId) {
        const data = cropper.getData();
        updateFileState(activeImageId, { cropData: data });
      }
    }, 200);
  };

  const saveCroppedImage = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    if (id === activeImageId && cropperRef.current?.cropper) {
      const canvas = cropperRef.current.cropper.getCroppedCanvas({
        fillColor: 'transparent',
        imageSmoothingQuality: 'high',
      });
      if (canvas) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${outputFormat}`, quality / 100));
        if (blob) {
          const url = URL.createObjectURL(blob);
          const dataUrl = canvas.toDataURL(`image/${outputFormat}`, quality / 100);
          updateFileState(id, {
            isCropped: true,
            croppedUrl: url,
            croppedBlob: blob,
            croppedDataUrl: dataUrl
          });
        }
      }
    }
  };

  // Save the current crop when switching images
  useEffect(() => {
    if (activeImageId) {
      // We can't easily save "previous" here because activeImageId has already changed.
      // We need to save BEFORE changing.
      // But we can just rely on `cropAll` to process the *active* one, and assume others are already processed?
      // No, if I edit Image A, then switch to Image B, Image A's `croppedUrl` is NOT updated unless I clicked "Crop".
      // But `cropData` IS updated via `onCrop`.

      // So, if I have `cropData` but no `croppedUrl` (or it's stale), I need to generate it.
      // But I can't generate it without the ref!

      // Solution: Auto-generate crop when switching?
      // Or, just force the user to click "Apply" before switching? No, that's bad UX.

      // Better Solution:
      // When `cropAll` is clicked, we iterate.
      // For the active image, we use the ref.
      // For others, if they have `cropData`, we MUST use a manual canvas cropper.
      // So I DO need `getCroppedImg`.

      // Let's try the manual cropper again, but simpler.
      // We will rely on the fact that `react-cropper` uses `cropperjs`.
      // We can import `Cropper` from `cropperjs` and instantiate it on a hidden image?
      // Yes! We can create a temporary image element, attach a Cropper to it, crop, and destroy it.
      // This is reliable.
    }
  }, [activeImageId]);

  const processFileCrop = async (file: ImageFile): Promise<void> => {
    if (file.id === activeImageId && cropperRef.current?.cropper) {
      await saveCroppedImage(file.id);
      return;
    }

    if (!file.cropData) return;

    // For inactive files, use a temporary Cropper instance
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.src = file.originalUrl;
      img.style.opacity = '0';
      img.style.position = 'absolute';
      img.style.pointerEvents = 'none';
      document.body.appendChild(img);

      const tempCropper = new Cropper(img, {
        ready() {
          tempCropper.setData(file.cropData!);
          const canvas = tempCropper.getCroppedCanvas({
            fillColor: 'transparent',
            imageSmoothingQuality: 'high',
          });

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const dataUrl = canvas.toDataURL(`image/${outputFormat}`, quality / 100);
              updateFileState(file.id, {
                isCropped: true,
                croppedUrl: url,
                croppedBlob: blob,
                croppedDataUrl: dataUrl
              });
            }
            tempCropper.destroy();
            document.body.removeChild(img);
            resolve();
          }, `image/${outputFormat}`, quality / 100);
        },
      });
    });
  };

  const cropAll = async () => {
    setIsProcessingAll(true);

    // Process all files that have cropData
    const promises = files.map(file => {
      if (file.cropData) {
        return processFileCrop(file);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);

    setIsProcessingAll(false);
    toast({ title: 'All images cropped!', description: 'Ready for download.' });
    setView('results');
  };

  const handleDownloadAll = async () => {
    const filesToDownload = files.filter(f => f.isCropped && f.croppedBlob);
    if (filesToDownload.length === 0) return;

    if (filesToDownload.length === 1 && filesToDownload[0].croppedDataUrl) {
      sessionStorage.setItem('crop-image-file', filesToDownload[0].croppedDataUrl);
      sessionStorage.setItem('crop-image-filename', filesToDownload[0].file.name.replace(/(\\.[^/.]+)/i, `_cropped.${outputFormat}`));
      sessionStorage.setItem('return-url', window.location.pathname);
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
      sessionStorage.setItem('return-url', window.location.pathname);
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

  const handleSetAspect = (newAspect: number | undefined) => {
    if (activeImageId) {
      updateFileState(activeImageId, { aspect: newAspect });
    }
  }

  // Effect to update cropper when active image changes
  useEffect(() => {
    if (cropperRef.current?.cropper && activeImage?.cropData) {
      cropperRef.current.cropper.setData(activeImage.cropData);
    }
  }, [activeImageId]); // eslint-disable-line react-hooks/exhaustive-deps


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
              className={cn('w-full max-w-lg mx-auto flex items-center justify-center transition-colors', isDragging ? 'bg-primary/10 border-primary' : 'bg-transparent')}
              onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
              <CardContent className="p-6 text-center w-full flex flex-col items-center justify-center">
                <div className="border-2 border-dashed rounded-xl p-8 hover:border-primary transition-colors cursor-pointer w-full flex flex-col items-center justify-center" onClick={handleUploadClick}>
                  <Scissors className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
                  <p className="text-muted-foreground mt-2">or</p>
                  <Button className="mt-4 pointer-events-none" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Select Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className='w-full h-[500px] flex items-center justify-center overflow-hidden bg-muted/30 p-4'>
                {activeImage ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {view === 'results' && activeImage.isCropped && activeImage.croppedUrl ? (
                      <ReactCompareSlider
                        itemOne={<ReactCompareSliderImage src={activeImage.originalUrl} alt="Original" />}
                        itemTwo={<ReactCompareSliderImage src={activeImage.croppedUrl || activeImage.originalUrl} alt="Cropped" />}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-black">
                        <ReactCropper
                          src={activeImage.originalUrl}
                          style={{ height: '500px', width: '100%' }}
                          initialAspectRatio={undefined}
                          aspectRatio={activeImage.aspect}
                          guides={true}
                          ref={cropperRef}
                          viewMode={1}
                          dragMode="move"
                          scalable={true}
                          cropBoxMovable={true}
                          cropBoxResizable={true}
                          background={false}
                          responsive={true}
                          autoCropArea={0.8}
                          checkOrientation={false}
                          crop={onCrop}
                        />
                      </div>
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
                        <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10">
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
                      <Button variant="outline" onClick={() => cropperRef.current?.cropper.rotate(-90)}><RotateCcw className="mr-2" /> Rotate Left</Button>
                      <Button variant="outline" onClick={() => cropperRef.current?.cropper.rotate(90)}><RotateCw className="mr-2" /> Rotate Right</Button>
                      <Button variant="outline" onClick={() => cropperRef.current?.cropper.scaleX(cropperRef.current.cropper.getData().scaleX === 1 ? -1 : 1)}><FlipHorizontal className="mr-2" /> Flip Horiz.</Button>
                      <Button variant="outline" onClick={() => cropperRef.current?.cropper.scaleY(cropperRef.current.cropper.getData().scaleY === 1 ? -1 : 1)}><FlipVertical className="mr-2" /> Flip Vert.</Button>
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
                      <><Scissors className="mr-2 h-5 w-5" />Crop Image</>
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
                                sessionStorage.setItem('return-url', window.location.pathname);
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

      <section className="mt-16 space-y-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">About the Image Cropper</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Image Cropper is a versatile tool designed to help you frame your photos perfectly. Whether you need to remove unwanted edges, focus on a specific subject, or adjust the aspect ratio for social media, this tool makes it simple. With an intuitive drag-and-drop interface, you can crop your images with precision.
              <br /><br />
              We offer a variety of preset aspect ratios like 1:1 (Square), 16:9 (Widescreen), and 4:3, or you can use the freeform mode to crop exactly how you want. Plus, you can rotate and flip your images to get the perfect orientation before cropping.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">How to Crop an Image</h2>
            <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Upload Your Image:</span> Drag and drop your image into the upload area or click to select one from your device.</li>
              <li><span className="font-semibold text-foreground">Adjust the Crop Area:</span> Drag the corners or edges of the crop box to select the part of the image you want to keep. You can also move the entire box.</li>
              <li><span className="font-semibold text-foreground">Choose Aspect Ratio:</span> Select a preset ratio (like Square or Portrait) to lock the crop box dimensions, or stick with Freeform for total control.</li>
              <li><span className="font-semibold text-foreground">Rotate or Flip (Optional):</span> Use the transform tools to rotate or flip your image if needed.</li>
              <li><span className="font-semibold text-foreground">Crop and Download:</span> Click the "Crop Image" button to apply your changes. Once processed, download your perfectly framed image.</li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start"><Scissors className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Precise Cropping:</span> Intuitive handles and grid lines help you crop with pixel-perfect accuracy.</div></li>
              <li className="flex items-start"><Scissors className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Preset Ratios:</span> Quickly apply common aspect ratios for Instagram, YouTube, Facebook, and more.</div></li>
              <li className="flex items-start"><Scissors className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Transform Tools:</span> Rotate and flip your images to correct orientation issues before cropping.</div></li>
              <li className="flex items-start"><Scissors className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">High Quality:</span> Your images are processed with high-quality algorithms to ensure crisp results.</div></li>
              <li className="flex items-start"><Scissors className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Secure & Private:</span> All processing happens in your browser or securely on our servers. Your images are never stored permanently.</div></li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Does cropping reduce image quality?</h3>
                <p className="text-muted-foreground">Cropping removes pixels from the image, so the overall resolution (dimensions) will decrease. However, the quality of the remaining pixels stays the same unless you also choose to compress the image.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Can I crop multiple images at once?</h3>
                <p className="text-muted-foreground">Currently, our tool focuses on cropping one image at a time to ensure you get the perfect frame for each photo. You can upload multiple images and crop them sequentially.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What format will my cropped image be?</h3>
                <p className="text-muted-foreground">You can choose to save your cropped image as a JPEG, PNG, or WEBP file. We recommend JPEG for photos and PNG for graphics with transparency.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

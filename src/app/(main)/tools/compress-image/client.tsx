'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, RefreshCw, X, PlusCircle, CheckCircle, FileDown, Wand2, Bookmark, Share2, Lock, Unlock, Settings } from 'lucide-react';
import { formatBytes, cn } from '@/lib/utils';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import { Switch } from '@/components/ui/switch';


type ImageFile = {
    id: string;
    file: File;
    originalUrl: string;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    compressedUrl: string | null;
    compressedBlob: Blob | null;
    compressedDataUrl?: string;
    compressedSize: number | null;
    isCompressing: boolean;
    isCompressed: boolean;
};

type OutputFormat = 'jpeg' | 'png' | 'webp';
type ResizeMode = 'pixels' | 'percentage';

import { UserProfile } from '@/types';

export default function CompressImageClient() {
    const router = useRouter();
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [activeImageId, setActiveImageId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingAll, setIsProcessingAll] = useState(false);

    // Settings
    const [quality, setQuality] = useState(80);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');

    const [resizeEnabled, setResizeEnabled] = useState(false);
    const [resizeMode, setResizeMode] = useState<ResizeMode>('pixels');
    const [width, setWidth] = useState<number | string>('');
    const [height, setHeight] = useState<number | string>('');
    const [percentage, setPercentage] = useState(100);
    const [keepAspectRatio, setKeepAspectRatio] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

    const toolPath = '/tools/compress-image';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    const activeImage = useMemo(() => files.find(f => f.id === activeImageId) || null, [files, activeImageId]);
    const allFilesCompressed = files.length > 0 && files.every(f => f.isCompressed);

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
            title: 'AI Image Compressor',
            text: 'Check out this AI Image Compressor tool!',
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
                            originalSize: file.size,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            compressedUrl: null,
                            compressedBlob: null,
                            compressedSize: null,
                            isCompressing: false,
                            isCompressed: false,
                        });
                    };
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
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (files.length === 0) setIsDragging(true);
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
            if (fileToRemove?.compressedUrl) URL.revokeObjectURL(fileToRemove.compressedUrl);
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
            if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
        });
        setFiles([]);
        setActiveImageId(null);
        setIsProcessingAll(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const blobToDataURL = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const compressSingleImage = useCallback(async (fileToCompress: ImageFile, newWidth?: number, newHeight?: number): Promise<(ImageFile) | null> => {
        if (fileToCompress.isCompressing) return null;

        setFiles(prev => prev.map(f => f.id === fileToCompress.id ? { ...f, isCompressing: true } : f));

        return new Promise(async (resolvePromise) => {
            try {
                const image = await new Promise<HTMLImageElement>((resolveImg, rejectImg) => {
                    const img = new window.Image();
                    img.onload = () => resolveImg(img);
                    img.onerror = rejectImg;
                    img.src = fileToCompress.originalUrl;
                });

                const canvas = document.createElement('canvas');
                let targetWidth = newWidth || (resizeEnabled ? Number(width) : image.width);
                let targetHeight = newHeight || (resizeEnabled ? Number(height) : image.height);

                if (resizeEnabled && !newWidth && !newHeight) {
                    if (resizeMode === 'percentage') {
                        const scale = percentage / 100;
                        targetWidth = Math.round(image.width * scale);
                        targetHeight = Math.round(image.height * scale);
                    }
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');

                ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

                const blob = await new Promise<Blob | null>((resolveBlob) => {
                    canvas.toBlob(resolveBlob, `image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100);
                });

                if (!blob) throw new Error("Canvas to Blob conversion failed");

                const compressedUrl = URL.createObjectURL(blob);
                const compressedDataUrl = await blobToDataURL(blob);

                const updatedFile: ImageFile = {
                    ...fileToCompress,
                    isCompressing: false,
                    isCompressed: true,
                    compressedUrl,
                    compressedBlob: blob,
                    compressedSize: blob.size,
                    compressedDataUrl,
                };

                setFiles(prev => prev.map(f => f.id === fileToCompress.id ? updatedFile : f));
                resolvePromise(updatedFile);

            } catch (error) {
                console.error(error);
                toast({ title: 'Compression failed', description: `Could not process ${fileToCompress.file.name}`, variant: 'destructive' });
                setFiles(prev => prev.map(f => f.id === fileToCompress.id ? { ...f, isCompressing: false } : f));
                resolvePromise(null);
            }
        });
    }, [outputFormat, quality, resizeEnabled, resizeMode, width, height, percentage, toast]);

    const handleCompressAll = async () => {
        if (isProcessingAll) return;
        setIsProcessingAll(true);

        const finalWidth = resizeEnabled ? Number(width) : undefined;
        const finalHeight = resizeEnabled ? Number(height) : undefined;

        const compressedFilesPromises = files.map(file =>
            file.isCompressed ? Promise.resolve(file) : compressSingleImage(file, finalWidth, finalHeight)
        );

        await Promise.all(compressedFilesPromises);
        setIsProcessingAll(false);
    };

    const handleDownloadAll = async () => {
        const filesToDownload = files.filter(f => f.isCompressed);

        if (filesToDownload.length === 0) {
            toast({ title: "Nothing to download", description: "No images are compressed.", variant: "destructive" });
            return;
        }

        if (filesToDownload.length === 1) {
            const file = filesToDownload[0];
            if (file.compressedDataUrl) {
                // Clear previous data to ensure freshness
                sessionStorage.removeItem('compress-image-file');
                sessionStorage.removeItem('compress-image-filename');
                sessionStorage.removeItem('compress-image-size');
                sessionStorage.removeItem('compress-image-type');

                const filename = file.file.name.replace(/(\.[^/.]+)/i, `_compressed.${outputFormat}`);

                await sessionStorage.setItem('compress-image-file', file.compressedDataUrl);
                await sessionStorage.setItem('compress-image-filename', filename);
                await sessionStorage.setItem('compress-image-size', file.compressedSize?.toString() || '0');
                await sessionStorage.setItem('compress-image-type', file.compressedBlob?.type || `image/${outputFormat}`);

                router.push('/download/compress-image');
            } else {
                toast({ title: "Error", description: "Could not prepare file for download.", variant: "destructive" });
            }
        } else {
            try {
                const zip = new JSZip();
                for (const file of filesToDownload) {
                    if (file.compressedBlob) {
                        zip.file(file.file.name.replace(/(\.[^/.]+)/i, `_compressed.${outputFormat}`), file.compressedBlob);
                    }
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                const dataUrl = await blobToDataURL(zipBlob);

                // Clear previous data
                sessionStorage.removeItem('compress-image-file');
                sessionStorage.removeItem('compress-image-filename');
                sessionStorage.removeItem('compress-image-size');
                sessionStorage.removeItem('compress-image-type');

                await sessionStorage.setItem('compress-image-file', dataUrl);
                await sessionStorage.setItem('compress-image-filename', 'dorex-ai-compressed.zip');
                await sessionStorage.setItem('compress-image-size', zipBlob.size.toString());
                await sessionStorage.setItem('compress-image-type', 'application/zip');

                router.push('/download/compress-image');
            } catch (e) {
                console.error(e);
                toast({ title: "Download Failed", description: "Could not create ZIP file.", variant: "destructive" });
            }
        }
    };

    useEffect(() => {
        if (activeImage && !resizeEnabled) {
            setWidth(activeImage.originalWidth);
            setHeight(activeImage.originalHeight);
            setPercentage(100);
        }
    }, [activeImage, resizeEnabled]);

    const handleWidthChange = (value: string) => {
        setWidth(value);
        if (activeImage && keepAspectRatio && resizeMode === 'pixels') {
            const numWidth = Number(value);
            if (numWidth > 0) {
                setHeight(Math.round(numWidth / (activeImage.originalWidth / activeImage.originalHeight)).toString());
            } else {
                setHeight('');
            }
        }
    };

    const handleHeightChange = (value: string) => {
        setHeight(value);
        if (activeImage && keepAspectRatio && resizeMode === 'pixels') {
            const numHeight = Number(value);
            if (numHeight > 0) {
                setWidth(Math.round(numHeight * (activeImage.originalWidth / activeImage.originalHeight)).toString());
            } else {
                setWidth('');
            }
        }
    };

    useEffect(() => {
        if (!activeImage || resizeMode !== 'percentage') return;
        const scale = percentage / 100;
        setWidth(Math.round(activeImage.originalWidth * scale));
        setHeight(Math.round(activeImage.originalHeight * scale));
    }, [percentage, resizeMode, activeImage]);

    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
                if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const relatedTools = tools.filter(tool => ['/tools/resize-image', '/tools/convert-to-jpg'].includes(tool.path));

    return (
        <div className="container mx-auto py-8 md:py-12">
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
                            <BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Image Compressor</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Image Compressor</h1>
                <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    Reduce image file sizes for JPEG, PNG, and WEBP formats with our smart compression tool, ensuring optimal quality and faster load times.
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
                <div
                    className={cn('w-full max-w-3xl mx-auto flex items-center justify-center transition-colors h-96 rounded-xl', isDragging ? 'bg-primary/10' : 'bg-transparent')}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
                    <div className="border-2 border-dashed rounded-xl p-12 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-lg transition-all duration-300 cursor-pointer text-center" onClick={handleUploadClick}>
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Drag & drop your images here</h3>
                        <p className="text-muted-foreground mt-2">or</p>
                        <Button className="mt-4 pointer-events-none">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Select Images
                        </Button>
                    </div>
                </div>
            ) : (
                <Card className="w-full">
                    <CardContent className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                        <main className="space-y-4">
                            <Card className='w-full h-[450px] flex items-center justify-center overflow-hidden bg-muted/20 relative'>
                                {isProcessingAll && (
                                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="mt-4 text-muted-foreground">Compressing all images...</p>
                                    </div>
                                )}
                                {activeImage && (
                                    <>
                                        {allFilesCompressed && activeImage.compressedUrl ? (
                                            <ReactCompareSlider
                                                itemOne={<ReactCompareSliderImage src={activeImage.originalUrl} alt="Original" />}
                                                itemTwo={<ReactCompareSliderImage src={activeImage.compressedUrl || ''} alt="Compressed" />}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            activeImage.originalUrl && <Image src={activeImage.originalUrl} alt="Original" layout="fill" objectFit="contain" />
                                        )}
                                        <div className='absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs z-10 pointer-events-none'>
                                            {activeImage.originalWidth} x {activeImage.originalHeight} &bull; {formatBytes(activeImage.originalSize)}
                                            {activeImage.isCompressed && activeImage.compressedSize && (
                                                <> &rarr; {formatBytes(activeImage.compressedSize)} <span className="text-green-400">(-{(100 - (activeImage.compressedSize / activeImage.originalSize) * 100).toFixed(0)}%)</span></>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Card>

                            <Card>
                                <CardContent className="p-2">
                                    <div className="flex gap-2 items-center overflow-x-auto">
                                        {files.map(f => (
                                            <div key={f.id} className='relative shrink-0'>
                                                <button onClick={() => setActiveImageId(f.id)} className={cn('block w-24 h-24 rounded-md overflow-hidden border-2', activeImageId === f.id ? 'border-primary' : 'border-transparent')}>
                                                    <Image src={f.isCompressed && f.compressedUrl ? f.compressedUrl : f.originalUrl} alt={f.file.name} width={96} height={96} className="object-cover w-full h-full" />
                                                </button>
                                                <Button variant="destructive" size="icon" onClick={() => removeFile(f.id)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"><X className="h-4 w-4" /></Button>
                                                {f.isCompressed && (
                                                    <div className="absolute bottom-1 right-1 bg-green-500/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-white text-xs font-bold">
                                                        -{(100 - (f.compressedSize! / f.originalSize) * 100).toFixed(0)}%
                                                    </div>
                                                )}
                                                {f.isCompressing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                                            </div>
                                        ))}
                                        <button onClick={handleUploadClick} className='shrink-0 w-24 h-24 rounded-md bg-muted/50 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted'>
                                            <PlusCircle className="h-6 w-6" /><span className='text-sm mt-1'>Add More</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
                                    </div>
                                </CardContent>
                            </Card>
                        </main>

                        <aside className="lg:sticky lg:top-24 self-start space-y-6">
                            <Accordion type="multiple" defaultValue={['compression', 'resize', 'output']} className="w-full">
                                <AccordionItem value="compression">
                                    <AccordionTrigger className="text-lg font-semibold">Compression</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label>Quality ({quality})</Label>
                                            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="resize">
                                    <AccordionTrigger className="text-lg font-semibold">Resize</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Enable Resizing</Label>
                                            <Switch checked={resizeEnabled} onCheckedChange={setResizeEnabled} />
                                        </div>
                                        {resizeEnabled && (
                                            <>
                                                <RadioGroup value={resizeMode} onValueChange={(v) => setResizeMode(v as ResizeMode)} className="grid grid-cols-2 gap-2">
                                                    <Label className="border rounded-md p-3 flex items-center gap-2 cursor-pointer has-[:checked]:border-primary"><RadioGroupItem value="pixels" />By Pixels</Label>
                                                    <Label className="border rounded-md p-3 flex items-center gap-2 cursor-pointer has-[:checked]:border-primary"><RadioGroupItem value="percentage" />By Percentage</Label>
                                                </RadioGroup>
                                                {resizeMode === 'pixels' ? (
                                                    <div className='flex items-center gap-2'>
                                                        <Input id="width-input" type="number" placeholder="Width" value={width} onChange={e => handleWidthChange(e.target.value)} disabled={!activeImage} />
                                                        <Button variant="ghost" size="icon" onClick={() => setKeepAspectRatio(!keepAspectRatio)}>
                                                            {keepAspectRatio ? <Lock className="h-5 w-5 text-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                                                        </Button>
                                                        <Input id="height-input" type="number" placeholder="Height" value={height} onChange={e => handleHeightChange(e.target.value)} disabled={!activeImage} />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Label>Scale ({percentage}%)</Label>
                                                        <Slider value={[percentage]} onValueChange={(v) => setPercentage(v[0])} max={200} step={1} disabled={!activeImage} />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="output">
                                    <AccordionTrigger className="text-lg font-semibold">Output</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-4">
                                        <div className='space-y-2'>
                                            <Label>Output Format</Label>
                                            <Select value="jpeg" disabled>
                                                <SelectTrigger><SelectValue placeholder="JPEG" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Only JPEG format is supported for downloads.</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                            <div className="space-y-2">
                                {allFilesCompressed ? (
                                    <>
                                        <Button onClick={handleDownloadAll} size="lg" className='w-full h-12 text-base' disabled={isProcessingAll}>
                                            {isProcessingAll ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                                            {files.length > 1 ? `Download All (.zip)` : `Download Image`}
                                        </Button>
                                        <Button onClick={resetFiles} size="lg" variant="outline" className='w-full h-12 text-base'>
                                            <RefreshCw className="mr-2 h-5 w-5" />
                                            Start Over
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleCompressAll} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                                        {isProcessingAll ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Compressing...</> : `Compress Images (${files.length})`}
                                    </Button>
                                )}
                            </div>

                        </aside>
                    </CardContent>
                </Card>
            )}
            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About the Image Compressor</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our Image Compressor is an essential tool for web developers, photographers, and marketers who need to optimize images for web performance. Large image files can significantly slow down your website, leading to a poor user experience and lower search engine rankings. This tool helps you solve that problem by intelligently reducing the file size of your images (JPEG, PNG, WEBP) without a noticeable drop in quality.
                            <br /><br />
                            You have full control over the compression level, allowing you to find the perfect balance between file size and visual fidelity. Additionally, you can resize images and change formats all in one go, making it a versatile and powerful utility for your entire image optimization workflow.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Use the Image Compressor</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Upload Your Images:</span> Drag and drop one or more images (JPG, PNG, WEBP, etc.) into the upload area, or click to select files from your device.</li>
                            <li><span className="font-semibold text-foreground">Adjust Compression Settings:</span> Use the "Quality" slider to set your desired compression level. A lower number results in a smaller file size but may reduce quality.</li>
                            <li><span className="font-semibold text-foreground">Resize (Optional):</span> If you need to change the image dimensions, enable the "Resize" option and set the new width, height, or percentage.</li>
                            <li><span className="font-semibold text-foreground">Choose Output Format:</span> Select your desired final format (JPEG, PNG, or WEBP).</li>
                            <li><span className="font-semibold text-foreground">Compress & Download:</span> Click the "Compress & Download" button. The tool will process all your images with the selected settings and prepare them for download. For multiple files, they will be bundled into a single ZIP archive.</li>
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>What's the difference between JPG, PNG, and WEBP?</AccordionTrigger>
                                <AccordionContent>JPG is best for photos and offers great compression. PNG supports transparency and is better for graphics with sharp lines. WEBP is a modern format that offers excellent compression for both photos and graphics, but may not be supported by very old browsers.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>What is a good quality setting to use?</AccordionTrigger>
                                <AccordionContent>A quality setting between 75-90 is usually a great starting point, as it provides a significant size reduction with almost no visible loss in quality. For web graphics, you can often go lower (65-75) to maximize savings.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Are my uploaded images secure?</AccordionTrigger>
                                <AccordionContent>Yes. We process your images in your browser or on our secure servers, and they are automatically deleted after processing. We never store or share your files.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Can I compress multiple images at once?</AccordionTrigger>
                                <AccordionContent>Absolutely. You can upload multiple images, and the tool will apply the same settings to all of them. The final result will be downloaded as a convenient ZIP file.</AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>
            <RelatedTools tools={relatedTools} />
        </div>
    );
}


'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    Upload, Download, ImageIcon, Loader2, X, PlusCircle, FileDown,
    RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Wand2, RefreshCw, Bookmark, Share2, CheckCircle
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { straightenImage } from '@/ai/flows/image-straighten-flow';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Accordion, AccordionTrigger, AccordionContent, AccordionItem } from '@/components/ui/accordion';


type ImageFile = {
    id: string;
    file: File;
    originalUrl: string;
    transformedUrl: string | null;
    transformedBlob: Blob | null;
    transformedDataUrl?: string;
    isProcessing: boolean;
    isProcessed: boolean;
};

type OutputFormat = 'jpeg' | 'png' | 'webp';

export default function RotateImagePage() {
    const router = useRouter();
    const [files, setFiles] = useState<ImageFile[]>([]);
    const [activeImageId, setActiveImageId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingAll, setIsProcessingAll] = useState(false);
    const [view, setView] = useState<'settings' | 'results'>('settings');

    const [rotations, setRotations] = useState<{ [id: string]: number }>({});
    const [flips, setFlips] = useState<{ [id: string]: { horizontal: boolean, vertical: boolean } }>({});

    const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
    const [quality, setQuality] = useState(90);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const { user, profile } = useUser();
    const firestore = useFirestore();
    const userDocRef = user ? doc(firestore, 'users', user.uid) : null;
    const { data: userProfile } = useDoc(userDocRef as any);

    const toolPath = '/tools/rotate-image';
    const isFavorite = (userProfile as any)?.favoriteTools?.includes(toolPath);

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
            title: 'AI-Powered Image Rotator',
            text: 'Check out this AI-Powered Image Rotator tool!',
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
    const allFilesProcessed = files.length > 0 && files.every(f => f.isProcessed);

    const handleFiles = (incomingFiles: FileList | null) => {
        if (!incomingFiles) return;

        const newImageFiles: ImageFile[] = Array.from(incomingFiles)
            .filter(file => file.type.startsWith('image/'))
            .map(file => {
                const id = `${file.name}-${file.lastModified}-${Math.random()}`;
                setRotations(prev => ({ ...prev, [id]: 0 }));
                setFlips(prev => ({ ...prev, [id]: { horizontal: false, vertical: false } }));
                return {
                    id,
                    file,
                    originalUrl: URL.createObjectURL(file),
                    transformedUrl: null,
                    transformedBlob: null,
                    isProcessing: false,
                    isProcessed: false,
                }
            });

        if (newImageFiles.length !== incomingFiles.length) {
            toast({ title: 'Some files were skipped', description: 'Only image files are supported.' });
        }

        setFiles(prev => {
            const updatedFiles = [...prev, ...newImageFiles];
            if (!activeImageId && updatedFiles.length > 0) {
                setActiveImageId(updatedFiles[0].id);
            }
            return updatedFiles;
        });
        setView('settings');
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
            if (f.transformedUrl) URL.revokeObjectURL(f.transformedUrl);
        });
        setFiles([]);
        setActiveImageId(null);
        setIsProcessingAll(false);
        setRotations({});
        setFlips({});
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

    const applyTransformations = async (id: string) => {
        const fileToTransform = files.find(f => f.id === id);
        if (!fileToTransform || fileToTransform.isProcessing) return;

        setFiles(prev => prev.map(f => f.id === id ? { ...f, isProcessing: true } : f));

        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = fileToTransform.originalUrl;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rotation = rotations[id] || 0;
        const flip = flips[id] || { horizontal: false, vertical: false };

        const rotRad = rotation * Math.PI / 180;
        const { width, height } = image;

        const newWidth = Math.abs(width * Math.cos(rotRad)) + Math.abs(height * Math.sin(rotRad));
        const newHeight = Math.abs(width * Math.sin(rotRad)) + Math.abs(height * Math.cos(rotRad));

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(rotRad);
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, `image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100);
        });

        if (!blob) {
            toast({ title: 'Transformation failed', variant: 'destructive' });
            setFiles(prev => prev.map(f => f.id === id ? { ...f, isProcessing: false } : f));
            return;
        }

        const transformedUrl = URL.createObjectURL(blob);
        const transformedDataUrl = await blobToDataURL(blob);
        setFiles(prev => prev.map(f => {
            if (f.id === id) {
                if (f.transformedUrl) URL.revokeObjectURL(f.transformedUrl);
                return {
                    ...f,
                    isProcessing: false,
                    isProcessed: true,
                    transformedUrl,
                    transformedBlob: blob,
                    transformedDataUrl,
                }
            }
            return f;
        }));
    };

    const processAll = async () => {
        setIsProcessingAll(true);
        await Promise.all(files.map(file => applyTransformations(file.id)));
        setIsProcessingAll(false);
        toast({ title: 'All images transformed!', description: 'Ready for download.' });
        setView('results');
    };

    const handleDownloadAll = async () => {
        const filesToDownload = files.filter(f => f.isProcessed && f.transformedBlob);
        if (filesToDownload.length === 0) return;

        if (filesToDownload.length === 1) {
            const file = filesToDownload[0];
            if (file.transformedDataUrl) {
                await sessionStorage.setItem('rotate-image-file', file.transformedDataUrl);
                await sessionStorage.setItem('rotate-image-filename', file.file.name.replace(/(\\.[^/.]+)/i, `_rotated.${outputFormat}`));
                sessionStorage.setItem('return-url', window.location.pathname);
                router.push('/download/rotate-image');
            } else {
                toast({ title: "Error", description: "Could not prepare file for download.", variant: "destructive" });
            }
        } else {
            try {
                const zip = new JSZip();
                for (const file of filesToDownload) {
                    if (file.transformedBlob) {
                        zip.file(file.file.name.replace(/(\\.[^/.]+)/i, `_rotated.${outputFormat}`), file.transformedBlob);
                    }
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                const dataUrl = await blobToDataURL(zipBlob);
                await sessionStorage.setItem('rotate-image-file', dataUrl);
                await sessionStorage.setItem('rotate-image-filename', `dorex-ai-rotated-images.zip`);
                sessionStorage.setItem('return-url', window.location.pathname);
                router.push('/download/rotate-image');
            } catch (e) {
                console.error(e);
                toast({ title: "Download Failed", description: "Could not create ZIP file.", variant: "destructive" });
            }
        }
    };

    const handleAiStraighten = async () => {
        if (!activeImage) return;
        setIsAiLoading(true);
        try {
            const { angle } = await straightenImage({ photoDataUri: activeImage.originalUrl });
            setRotations(prev => ({ ...prev, [activeImage.id]: (prev[activeImage.id] || 0) + angle }));
            toast({ title: "AI Auto-Straighten Applied", description: `Image corrected by ${angle.toFixed(2)} degrees.` });
        } catch (e) {
            console.error(e);
            toast({ title: 'AI Straighten Failed', description: 'Could not get AI suggestion.', variant: 'destructive' });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleTransform = (type: 'rotate' | 'flip', value: number | 'horizontal' | 'vertical') => {
        if (!activeImageId) return;

        if (type === 'rotate') {
            setRotations(prev => ({ ...prev, [activeImageId]: (prev[activeImageId] || 0) + (value as number) }));
        } else {
            setFlips(prev => ({ ...prev, [activeImageId]: { ...prev[activeImageId], [value]: !prev[activeImageId]?.[value as 'horizontal' | 'vertical'] } }));
        }
    }

    const activeRotation = activeImageId ? (rotations[activeImageId] || 0) : 0;
    const activeFlip = activeImageId ? (flips[activeImageId] || { horizontal: false, vertical: false }) : { horizontal: false, vertical: false };

    useEffect(() => {
        return () => {
            files.forEach(f => {
                URL.revokeObjectURL(f.originalUrl);
                if (f.transformedUrl) URL.revokeObjectURL(f.transformedUrl);
            });
        }
    }, [files]);

    const relatedTools = tools.filter(tool => ['/tools/crop-image', '/tools/resize-image'].includes(tool.path));

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
                        <BreadcrumbItem><BreadcrumbPage>Rotate Image</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Rotate, Flip, and Straighten Images Online</h1>
                <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    Quickly rotate images left or right, flip them horizontally or vertically, and use our AI to automatically straighten crooked photos with precision.
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
                            <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" multiple />
                            <CardContent className="p-6 text-center w-full">
                                <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                                    <RotateCw className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">Drag & drop your images here</h3>
                                    <p className="text-muted-foreground mt-2">or</p>
                                    <Button className="mt-4 pointer-events-none">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Select Images
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className='w-full aspect-video flex items-center justify-center overflow-hidden relative bg-muted/30'>
                                {activeImage ? (
                                    <Image
                                        src={view === 'results' && activeImage.transformedUrl ? activeImage.transformedUrl : activeImage.originalUrl}
                                        alt="Preview"
                                        width={500}
                                        height={500}
                                        className="max-w-full max-h-full object-contain transition-transform duration-300"
                                        style={view === 'settings' ? {
                                            transform: `rotate(${activeRotation}deg) scaleX(${activeFlip.horizontal ? -1 : 1}) scaleY(${activeFlip.vertical ? -1 : 1})`
                                        } : {}}
                                    />
                                ) : (
                                    <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-semibold">Select an image to transform</h3>
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
                        </>
                    )}
                </main>

                <aside className='lg:sticky lg:top-24 self-start space-y-6'>
                    {files.length > 0 && (
                        view === 'settings' ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transform Options</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-6'>
                                    <div className='space-y-2'>
                                        <Label>Transform</Label>
                                        <div className='grid grid-cols-2 gap-2'>
                                            <Button variant="outline" onClick={() => handleTransform('rotate', -90)}><RotateCcw className="mr-2" /> Rotate Left</Button>
                                            <Button variant="outline" onClick={() => handleTransform('rotate', 90)}><RotateCw className="mr-2" /> Rotate Right</Button>
                                            <Button variant="outline" onClick={() => handleTransform('flip', 'horizontal')}><FlipHorizontal className="mr-2" /> Flip Horiz</Button>
                                            <Button variant="outline" onClick={() => handleTransform('flip', 'vertical')}><FlipVertical className="mr-2" /> Flip Vert</Button>
                                        </div>
                                    </div>

                                    <Button onClick={handleAiStraighten} disabled={isAiLoading || !activeImage} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                        AI Auto-Straighten
                                    </Button>

                                    <CardTitle className="text-xl border-t pt-4">Output Options</CardTitle>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className="space-y-2">
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
                                    </div>
                                    <Button onClick={processAll} size="lg" className='w-full h-12 text-base' disabled={files.length === 0 || isProcessingAll}>
                                        {isProcessingAll ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                                        ) : (
                                            <><RefreshCw className="mr-2 h-5 w-5" />{`Apply Changes to ${files.length} Image(s)`}</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Results</CardTitle>
                                    <CardDescription>Your transformed images are ready.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                        {files.filter(f => f.isProcessed).map(f => (
                                            <Card key={f.id} className="p-3">
                                                <div className="flex items-center gap-4">
                                                    <Image src={f.transformedUrl!} alt={f.file.name} width={40} height={40} className="rounded-md aspect-square object-cover" />
                                                    <div className="flex-1 truncate">
                                                        <p className="font-semibold truncate text-sm">{f.file.name}</p>
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={async () => {
                                                            if (f.transformedDataUrl) {
                                                                await sessionStorage.setItem('rotate-image-file', f.transformedDataUrl);
                                                                await sessionStorage.setItem('rotate-image-filename', f.file.name.replace(/(\\.[^/.]+)/i, `_rotated.${outputFormat}`));
                                                                sessionStorage.setItem('return-url', window.location.pathname);
                                                                router.push('/download/rotate-image');
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
                                            Transform More
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
                        <h2 className="text-2xl font-semibold mb-4">About the Image Rotator</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Correcting the orientation of your photos has never been easier. Our Image Rotator tool allows you to quickly fix photos that were taken at the wrong angle. You can rotate images by 90-degree increments, flip them horizontally or vertically to create a mirror image, and even use our advanced AI to automatically straighten crooked horizons.
                            <br /><br />
                            This tool is perfect for photographers who need to make quick adjustments and for anyone who wants to perfect their pictures before sharing them. With batch processing, you can apply the same transformation to multiple images at once, saving you valuable time.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Rotate an Image</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Upload Image(s):</span> Start by dragging and dropping or selecting one or more images from your device.</li>
                            <li><span className="font-semibold text-foreground">Apply Transformations:</span> Select an image and use the buttons to rotate it left or right, or flip it. For automatic straightening, click "AI Auto-Straighten."</li>
                            <li><span className="font-semibold text-foreground">Set Output Options:</span> Choose your desired output format (JPEG, PNG, WEBP) and quality.</li>
                            <li><span className="font-semibold text-foreground">Process Your Images:</span> Click "Apply Changes" to perform the transformations on all your uploaded photos.</li>
                            <li><span className="font-semibold text-foreground">Download:</span> Once processed, download your newly oriented images individually or as a single ZIP file.</li>
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                        <ul className="space-y-4 text-muted-foreground">
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">90-Degree Rotation:</span> Easily turn your images left or right.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Flip/Mirror Images:</span> Flip images horizontally or vertically with a single click.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">AI-Powered Straightening:</span> Automatically detect and correct tilted photos to get a perfect horizon line.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Batch Processing:</span> Apply the same rotation and flip settings to multiple images at once.</div></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>What does the AI Auto-Straighten feature do?</AccordionTrigger>
                                <AccordionContent>The AI analyzes your image to find prominent horizontal or vertical lines (like the horizon) and calculates the precise angle needed to make them perfectly level. It then applies this rotation automatically.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Will rotating my image reduce its quality?</AccordionTrigger>
                                <AccordionContent>Rotations by 90 degrees and flips are lossless operations. Straightening by a custom angle requires re-rendering the image, but our tool maintains the highest possible quality during this process.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Can I rotate a batch of images by different angles?</AccordionTrigger>
                                <AccordionContent>Currently, the same rotation and flip settings are applied to all images in a batch. To apply different transformations, you would need to process the images in separate batches.</AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

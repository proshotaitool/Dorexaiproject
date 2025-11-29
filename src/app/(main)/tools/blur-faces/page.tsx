
'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, RefreshCw, Bookmark, Share2, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blurFaces } from '@/ai/flows/face-blur-flow';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation';

export default function BlurFacesPage() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [blurIntensity, setBlurIntensity] = useState(50);
  const [blurMode, setBlurMode] = useState<'blur' | 'pixelate'>('blur');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);
  
  const toolPath = '/tools/blur-faces';
  const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (incomingFile: File | null) => {
    if (!incomingFile || !incomingFile.type.startsWith('image/')) {
        toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' });
        return;
    }
    resetAll();
    const dataUri = await fileToDataUri(incomingFile);
    setOriginalUrl(dataUri);
  };
  
  const handleDrag = (e: React.DragEvent, enter: boolean) => {
    e.preventDefault(); e.stopPropagation();
    if(originalUrl) return;
    setIsDragging(enter);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e, false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0] || null);
  const handleUploadClick = () => fileInputRef.current?.click();

  const resetAll = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleDownload = async () => {
    if (!processedUrl) return;

    if (processedUrl.startsWith('data:')) {
        await sessionStorage.setItem('blur-faces-file', processedUrl);
        await sessionStorage.setItem('blur-faces-filename', 'dorex-ai-blurred.png');
        router.push('/download/blur-faces');
    } else {
        toast({ title: 'Error', description: 'Could not prepare file for download.', variant: 'destructive' });
    }
  };

  const handleDetectAndBlur = async () => {
    if (!originalUrl) return;
    setIsLoading(true);
    setProcessedUrl(null);
    try {
      const result = await blurFaces({ photoDataUri: originalUrl, blurMode, intensity: blurIntensity });

      if (result.error) {
        toast({ title: 'AI Processing Error', description: result.error, variant: 'destructive' });
      } else if (result.processedPhotoDataUri) {
        setProcessedUrl(result.processedPhotoDataUri);
        toast({ title: 'Faces Blurred!', description: `AI has processed your image.` });
      } else {
        throw new Error('No image was returned from the AI flow.');
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'AI Processing Failed', description: e.message || 'Could not process face detection and blurring.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!userDocRef) return;
    await updateDoc(userDocRef, {
        favoriteTools: isFavorite ? arrayRemove(toolPath) : arrayUnion(toolPath)
    });
    toast({ title: isFavorite ? 'Removed from favorites' : 'Added to favorites' });
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied!' });
  };
  
  const relatedTools = tools.filter(tool => ['/tools/ai-background-remover', '/tools/watermark-image'].includes(tool.path));
  
  return (
    <div className="container py-12">
        <div className="text-center mb-8">
          <Breadcrumb className="flex justify-center mb-4">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/tools">Tools</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Blur Faces</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Face Blurring Tool</h1>
          <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Protect privacy by automatically detecting and blurring faces in any image with a single click.
          </p>
        </div>
        <div className="flex justify-end gap-2 mb-4">
            {user && (
                <Button onClick={handleFavoriteToggle} variant="outline" className={cn("rounded-full transition-colors", isFavorite && "border-yellow-400 text-yellow-600 bg-yellow-100/50")}>
                    <Bookmark className={cn("mr-2 h-4 w-4", isFavorite && "fill-current")} /> {isFavorite ? 'Favorited' : 'Favorite'}
                </Button>
            )}
            <Button onClick={handleShare} variant="outline" className="rounded-full"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
            <main className="space-y-4">
                {!originalUrl ? (
                    <Card onDragEnter={(e) => handleDrag(e, true)} onDragLeave={(e) => handleDrag(e, false)} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                        <CardContent className="p-6 text-center w-full">
                        <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none"><Upload className="mr-2 h-4 w-4" /> Select Image</Button>
                        </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className={cn('w-full aspect-video flex items-center justify-center overflow-hidden relative bg-muted/30')}>
                      {isLoading && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="mt-4 text-muted-foreground">AI is processing your image...</p>
                        </div>
                      )}
                      {processedUrl ? (
                         <ReactCompareSlider
                            itemOne={<ReactCompareSliderImage src={originalUrl} alt="Original" />}
                            itemTwo={<ReactCompareSliderImage src={processedUrl} alt="Processed" />}
                            className="w-full h-full"
                          />
                      ) : (
                        <Image src={originalUrl} alt="Original" layout="fill" objectFit="contain" />
                      )}
                    </Card>
                )}
            </main>
            <aside className='lg:sticky lg:top-24 self-start space-y-6'>
              <Card>
                  <CardHeader><CardTitle className='text-2xl'>Blur Controls</CardTitle></CardHeader>
                  <CardContent className='space-y-6'>
                      <div className="space-y-2">
                          <Label>Blur Intensity ({blurIntensity})</Label>
                          <Slider value={[blurIntensity]} onValueChange={(v) => setBlurIntensity(v[0])} min={1} max={100} />
                      </div>
                      <div className="space-y-2">
                        <Label>Blur Style</Label>
                        <Tabs value={blurMode} onValueChange={(v) => setBlurMode(v as any)}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="blur">Blur</TabsTrigger>
                            <TabsTrigger value="pixelate">Pixelate</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      <div className='flex flex-col gap-2'>
                        <Button onClick={handleDetectAndBlur} size="lg" className='w-full h-12 text-base' disabled={!originalUrl || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Shield className="mr-2 h-5 w-5"/>}
                            {isLoading ? 'Processing...' : 'Blur Faces with AI'}
                        </Button>
                        {processedUrl && (
                          <Button onClick={handleDownload} variant="secondary" size="lg" className="w-full h-12 text-base">
                              <Download className="mr-2 h-5 w-5"/> Download Image
                          </Button>
                        )}
                        {originalUrl && (
                          <Button onClick={resetAll} size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4"/> Start Over</Button>
                        )}
                      </div>
                  </CardContent>
              </Card>
            </aside>
        </div>
         <section className="mt-16 space-y-8">
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">About the AI Face Blurring Tool</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Our AI Face Blurring tool offers a fast and effective way to protect privacy in your images. Using advanced facial recognition technology, it automatically identifies human faces in any photo and applies a high-quality blur or pixelation effect. This is essential for journalists, content creators, and anyone sharing images that contain individuals who have not consented to be shown.
                        <br /><br />
                        With just one click, you can ensure compliance with privacy regulations and ethical standards. The tool is designed for ease of use, allowing you to upload an image, select your preferred blur style and intensity, and let our AI handle the rest. The result is a professionally anonymized image, ready for public sharing.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">How to Automatically Blur Faces</h2>
                      <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                          <li><span className="font-semibold text-foreground">Upload Your Image:</span> Click the upload area or simply drag and drop your image file (JPG, PNG, WEBP, etc.).</li>
                          <li><span className="font-semibold text-foreground">Set Your Preferences:</span> Adjust the "Blur Intensity" slider to control the strength of the effect. Choose between "Blur" and "Pixelate" styles.</li>
                          <li><span className="font-semibold text-foreground">Process with AI:</span> Click the "Blur Faces with AI" button. Our system will detect all faces and apply your chosen blur effect.</li>
                          <li><span className="font-semibold text-foreground">Preview and Download:</span> A "before and after" slider will appear, showing you the result. If you're satisfied, click "Download Image" to save your protected photo.</li>
                      </ol>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What happens to my uploaded images?</AccordionTrigger>
                            <AccordionContent>Your privacy is our top priority. Uploaded images are processed securely and are automatically deleted from our servers after 24 hours. We do not view, share, or use your images for any other purpose.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Can the AI detect faces at an angle or partially obscured faces?</AccordionTrigger>
                            <AccordionContent>Our AI model is highly advanced and can detect faces from various angles, even if they are partially obscured. However, detection accuracy may vary depending on the image quality and the degree of obstruction.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>What's the difference between "Blur" and "Pixelate"?</AccordionTrigger>
                            <AccordionContent>"Blur" applies a smooth, Gaussian blur effect that makes faces unrecognizable. "Pixelate" creates a blocky, mosaic effect over the faces. Both are effective for anonymization, so the choice is a matter of aesthetic preference.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Can I unblur the image after downloading it?</AccordionTrigger>
                            <AccordionContent>No, the blur effect is permanently applied to the downloaded image and cannot be reversed. This ensures that the privacy of individuals in the photo is securely protected.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </CardContent>
              </Card>
            </section>
        <RelatedTools tools={relatedTools} />
      <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/*" />
    </div>
  );
}


'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, ImageIcon, Loader2, Star, X, Bookmark, Share2, Wand2, RefreshCcw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Image from 'next/image';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { upscaleImage } from '@/ai/flows/image-upscaler-flow';
import { OutOfCreditsDialog } from '@/components/out-of-credits-dialog';
import { deductCredit } from '@/lib/credits';
import { useRouter } from 'next/navigation';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ImageUpscalerPage() {
  const router = useRouter();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);

  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);

  const toolPath = '/tools/image-upscaler';
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
      title: 'AI Image Upscaler',
      text: 'Check out this AI Image Upscaler tool!',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    handleReset();
    const dataUri = await fileToDataUri(file);
    setOriginalImage(dataUri);
  };

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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleUpscale = async () => {
    if (!originalImage) {
      toast({ title: 'Missing Image', description: 'Please upload an image to upscale.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setProcessedImage(null);
    try {
      if (user && firestore) {
        await deductCredit(firestore, user.uid);
      }
      const result = await upscaleImage({ photoDataUri: originalImage, scale });
      setProcessedImage(result.processedPhotoDataUri);
      toast({ title: 'Upscaling Complete!', description: `Your image has been upscaled by ${scale}x.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Upscaling Failed', description: 'Could not upscale the image. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!processedImage) return;
    await sessionStorage.setItem('image-upscaler-file', processedImage);
    await sessionStorage.setItem('image-upscaler-filename', 'proshot-ai-upscaled.png');
    router.push('/download/image-upscaler');
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const relatedTools = tools.filter(tool => ['/tools/compress-image', '/tools/resize-image'].includes(tool.path));

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
              <BreadcrumbLink href="/tools/image">Image Tools</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Image Upscaler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free AI Image Upscaler</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Increase the resolution and quality of your images without losing detail. Perfect for enhancing old photos, low-resolution graphics, and more.
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
      {!originalImage ? (
        <Card
          className={cn(
            'w-full mx-auto flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary/10' : 'bg-transparent'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-6 text-center w-full">
            <div
              className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer"
              onClick={handleUploadClick}
            >
              <Star className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
              <p className="text-muted-foreground mt-2">or</p>
              <Button className="mt-4 pointer-events-none">
                <Upload className="mr-2 h-4 w-4" /> Select Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          <main>
            <Card className={cn('w-full aspect-video flex items-center justify-center overflow-hidden relative bg-muted/30')}>
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">AI is upscaling your image...</p>
                </div>
              )}
              {processedImage ? (
                <ReactCompareSlider
                  itemOne={<ReactCompareSliderImage src={originalImage} alt="Original" />}
                  itemTwo={<ReactCompareSliderImage src={processedImage} alt="Upscaled" />}
                  className="w-full h-full"
                />
              ) : (
                <Image src={originalImage} alt="Original" layout="fill" objectFit="contain" />
              )}
            </Card>
          </main>
          <aside className="lg:sticky lg:top-24 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Upscale Factor</Label>
                  <RadioGroup defaultValue="2" onValueChange={(v) => setScale(Number(v))} className="grid grid-cols-2 gap-4">
                    <Label className="border p-4 rounded-md has-[:checked]:border-primary flex items-center justify-center cursor-pointer">
                      <RadioGroupItem value="2" id="2x" className="sr-only" />
                      2x
                    </Label>
                    <Label className="border p-4 rounded-md has-[:checked]:border-primary flex items-center justify-center cursor-pointer">
                      <RadioGroupItem value="4" id="4x" className="sr-only" />
                      4x
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Button onClick={handleUpscale} disabled={isLoading} className="w-full h-12 text-base">
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Upscaling...</>
                    ) : (
                      <><Star className="mr-2 h-5 w-5" />Upscale Image</>
                    )}
                  </Button>
                  {processedImage && (
                    <Button onClick={handleDownload} variant="secondary" className="w-full h-12 text-base">
                      <Download className="mr-2 h-5 w-5" /> Download Upscaled Image
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>

          </aside>
        </div>
      )}
      <section className="mt-16 space-y-8">
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">About the AI Image Upscaler</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our AI Image Upscaler breathes new life into your low-resolution images. Using advanced machine learning algorithms, this tool intelligently increases the number of pixels in your photo, enhancing details and improving overall clarity without the usual pixelation. It's perfect for restoring old family photos, preparing images for print, or improving the quality of graphics downloaded from the web.
              <br /><br />
              Unlike traditional resizing methods that simply stretch the image, our AI analyzes the content to predict and generate new, realistic details. This "smart upscaling" results in a sharper, cleaner, and more detailed image that looks natural. Choose to upscale your image by 2x or 4x its original size and watch the magic happen.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">How to Use the AI Image Upscaler</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li><span className="font-semibold text-foreground">Upload Your Image:</span> Select or drag & drop a low-resolution image that you want to enhance.</li>
              <li><span className="font-semibold text-foreground">Choose Upscale Factor:</span> Select whether to upscale the image by 2x or 4x its original size.</li>
              <li><span className="font-semibold text-foreground">Let AI Work Its Magic:</span> Click the "Upscale Image" button. Our AI will analyze your image and intelligently add new details to increase its resolution.</li>
              <li><span className="font-semibold text-foreground">Compare and Download:</span> Use the slider on the preview to compare the original and the upscaled versions. Once you're satisfied, download your new high-resolution image.</li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is the maximum resolution I can upscale to?</AccordionTrigger>
                <AccordionContent>You can upscale your image up to 4 times its original resolution. For example, a 500x500 pixel image can become a 2000x2000 pixel image.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Does this tool work with any image type?</AccordionTrigger>
                <AccordionContent>The tool works best with JPG and PNG images. It's particularly effective on photographs and detailed illustrations where fine details can be enhanced.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Will upscaling make my image blurry?</AccordionTrigger>
                <AccordionContent>No, quite the opposite! Unlike standard resizing, our AI upscaler is designed to reduce blur and enhance sharpness by intelligently creating new pixels based on the surrounding context.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Are there any limitations?</AccordionTrigger>
                <AccordionContent>For optimal results, start with the highest quality version of the image you have. While the AI is powerful, it works best when it has a reasonable amount of detail to work with.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>
      <RelatedTools tools={relatedTools} />
      <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
}

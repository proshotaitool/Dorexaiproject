
'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { removeBackground } from '@/ai/flows/ai-background-remover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Eraser, Image as ImageIcon, Loader2, Upload, Bookmark, Share2, RefreshCcw, CheckCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { OutOfCreditsDialog } from '@/components/out-of-credits-dialog';
import { deductCredit } from '@/lib/credits';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AiBackgroundRemoverPage() {
  const router = useRouter();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
  
  const toolPath = '/tools/ai-background-remover';
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
      title: 'AI Background Remover',
      text: 'Check out this AI Background Remover tool!',
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    setProcessedImage(null);
    const dataUri = await fileToDataUri(file);
    setOriginalImage(dataUri);
    
    try {
      const result = await removeBackground({ photoDataUri: dataUri });
      if (result.error) {
          throw new Error(result.error);
      }
      setProcessedImage(result.processedPhotoDataUri || null);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove background. Please try again.',
        variant: 'destructive',
      });
      handleReset(); // Reset on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setIsLoading(false);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleDownload = async () => {
    if (!processedImage) return;
    await sessionStorage.setItem('ai-background-remover-file', processedImage);
    await sessionStorage.setItem('ai-background-remover-filename', 'dorex-ai-background-removed.png');
    router.push('/download/ai-background-remover');
  };

  const relatedTools = tools.filter(tool => ['/tools/blur-faces', '/tools/crop-image', '/tools/watermark-image'].includes(tool.path));


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
                  <BreadcrumbPage>AI Background Remover</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free AI Background Remover</h1>
            <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
             Instantly remove the background from any image with a single click. Our AI isolates the subject to create a transparent PNG, perfect for ecommerce, profile pictures, and more.
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
            <Card
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
                {!originalImage ? (
                    <CardContent
                      className={cn("p-6 text-center transition-colors", isDragging && 'bg-primary/10')}
                    >
                        <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">Drag & drop your image here</h3>
                            <p className="text-muted-foreground mt-2">or</p>
                            <Button className="mt-4 pointer-events-none">
                                <ImageIcon className="mr-2 h-4 w-4" />
                                Select Image
                            </Button>
                        </div>
                    </CardContent>
                ) : (
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="relative aspect-video rounded-lg border-dashed border-2 flex items-center justify-center bg-muted/30">
                        {originalImage && <Image src={originalImage} alt="Original" layout="fill" objectFit="contain" className="rounded-lg" />}
                      </div>
                      
                      <div className="relative aspect-video rounded-lg border-dashed border-2 flex items-center justify-center bg-muted/30">
                         {isLoading && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg z-10">
                              <Loader2 className="h-10 w-10 animate-spin text-primary" />
                              <p className="mt-4 text-muted-foreground">Removing background...</p>
                           </div>
                         )}
                        {processedImage ? (
                          <Image src={processedImage} alt="Processed" layout="fill" objectFit="contain" className="rounded-lg" />
                        ) : (
                          !isLoading && (
                            <div className="text-center text-muted-foreground p-4">
                               <Eraser className="mx-auto h-12 w-12" />
                              <p className="mt-2">Background Removed</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        disabled={isLoading}
                      />
                      <Button onClick={handleReset} size="lg" variant="outline" disabled={isLoading}>
                        <RefreshCcw className="mr-2 h-5 w-5" />
                        Upload Another
                      </Button>
                      <Button onClick={handleDownload} size="lg" disabled={!processedImage || isLoading}>
                           <Download className="mr-2 h-5 w-5" />
                           Download Image
                      </Button>
                    </div>
                  </CardContent>
                )}
            </Card>
            <section className="mt-16 space-y-8">
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">About the AI Background Remover</h2>
                      <p className="text-muted-foreground leading-relaxed">
                          Our AI Background Remover is a powerful tool designed to save you time and effort. Whether you're a graphic designer, an e-commerce store owner, a social media manager, or just someone looking to create a cool profile picture, this tool is for you. With just one click, our advanced artificial intelligence analyzes your image, identifies the main subject, and precisely removes the background, leaving you with a high-quality, transparent PNG file.
                          <br /><br />
                          Forget about spending hours manually tracing objects in complicated software. Our tool automates the entire process, providing professional-grade cutouts in seconds. It's perfect for creating clean product images for online stores, designing stunning graphics, or making your personal photos pop. The resulting image can be easily placed on any background, giving you complete creative freedom.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">How to Use the AI Background Remover</h2>
                      <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                          <li><span className="font-semibold text-foreground">Upload Your Image:</span> Click the upload area or simply drag and drop your image file (JPG, PNG, WEBP, etc.) into the designated zone.</li>
                          <li><span className="font-semibold text-foreground">Automatic Processing:</span> As soon as you upload the image, our AI will automatically start processing it. You'll see a loading indicator while it works its magic.</li>
                          <li><span className="font-semibold text-foreground">Preview the Result:</span> In just a few seconds, you will see a side-by-side comparison of your original image and the new version with the background removed.</li>
                          <li><span className="font-semibold text-foreground">Download Your Image:</span> If you're happy with the result, click the "Download" button. Your new image will be saved as a high-quality PNG file with a transparent background.</li>
                          <li><span className="font-semibold text-foreground">Start Over (Optional):</span> To process another image, simply click the "Upload Another" button to reset the tool.</li>
                      </ol>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                      <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">One-Click Operation:</span> No complex settings or manual work required. Just upload and download.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">High-Precision AI:</span> Our model is trained to handle tricky details like hair and fine edges for a clean, professional cutout.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Saves Time & Money:</span> Eliminates the need for expensive software and hours of manual editing.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Transparent PNG Output:</span> Get a high-resolution PNG file with a transparent background, perfect for any design project.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Data Privacy:</span> Your images are processed securely and automatically deleted from our servers after a short period. We never share your data.</div></li>
                      </ul>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What kind of images work best?</AccordionTrigger>
                            <AccordionContent>The tool works best with images where the main subject is clearly defined against the background. While it can handle complex scenes, images with good contrast between the foreground and background yield the best results.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Is there a file size limit?</AccordionTrigger>
                            <AccordionContent>For best performance, we recommend uploading images under 10MB. While larger files may work, they will take longer to process.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>What happens to my uploaded images?</AccordionTrigger>
                            <AccordionContent>Your privacy is our priority. Your uploaded images are processed securely and are automatically deleted from our servers within 24 hours. We do not use your images for any other purpose.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Can I use the removed background images commercially?</AccordionTrigger>
                            <AccordionContent>Yes, absolutely! The images you create are yours to use for any personal or commercial project without any restrictions.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>What is the output format and resolution?</AccordionTrigger>
                            <AccordionContent>The tool outputs a PNG file with a transparent background. The resolution of the output image will be the same as the original image you uploaded, ensuring high quality.</AccordionContent>
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

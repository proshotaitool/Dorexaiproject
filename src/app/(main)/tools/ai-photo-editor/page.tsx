
'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, RefreshCcw, Wand2, Bookmark, Share2, Download, Loader2, CheckCircle } from 'lucide-react';
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
import { editImageWithPrompt } from '@/ai/flows/ai-photo-editor-flow';
import { OutOfCreditsDialog } from '@/components/out-of-credits-dialog';
import { deductCredit } from '@/lib/credits';
import { useRouter } from 'next/navigation';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AiPhotoEditorPage() {
  const router = useRouter();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
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
  
  const toolPath = '/tools/ai-photo-editor';
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
      title: 'AI Photo Editor',
      text: 'Check out this AI Photo Editor tool!',
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
  
  const handleDrag = (e: React.DragEvent, enter: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(enter);
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e, false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };
  
  const handleEdit = async () => {
    if (!originalImage || !prompt.trim()) {
        toast({ title: 'Missing Information', description: 'Please upload an image and provide an editing prompt.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    setEditedImage(null);
    try {
      if (user && firestore) {
        await deductCredit(firestore, user.uid);
      }
      const result = await editImageWithPrompt({ photoDataUri: originalImage, prompt });
      if(result.error) {
        throw new Error(result.error);
      }
      setEditedImage(result.editedPhotoDataUri || null);
      toast({ title: 'Edit Complete!', description: 'Your image has been edited by the AI.' });
    } catch (error: any) {
        console.error(error);
        toast({ title: 'Editing Failed', description: error.message || 'Could not apply AI edits. Please try again.', variant: 'destructive'});
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!editedImage) return;

    try {
        const blob = await fetch(editedImage).then(res => res.blob());
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dorex-ai-edited.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed", error);
        toast({ title: "Download Failed", description: "Could not download the image.", variant: "destructive" });
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const relatedTools = tools.filter(tool => ['/tools/ai-background-remover', '/tools/crop-image', '/tools/image-upscaler'].includes(tool.path));

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
              <BreadcrumbPage>AI Photo Editor</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free AI Photo Editor</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Edit photos with simple text commands. Describe your desired changes, and let our AI do the editing for you, from color adjustments to object removal.
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
              onDragEnter={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <CardContent className="p-6 text-center w-full">
                <div
                  className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer"
                  onClick={handleUploadClick}
                >
                  <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
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
                                <p className="mt-4 text-muted-foreground">AI is editing your image...</p>
                            </div>
                        )}
                        {editedImage ? (
                            <ReactCompareSlider
                            itemOne={<ReactCompareSliderImage src={originalImage} alt="Original" />}
                            itemTwo={<ReactCompareSliderImage src={editedImage} alt="Edited" />}
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
                        <Textarea 
                            placeholder="e.g., 'Make the sky blue', 'add a vintage film look', 'remove the person on the left'"
                            className="min-h-[120px] text-base"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                         <div className="space-y-2">
                           <Button onClick={handleEdit} disabled={isLoading} className="w-full h-12 text-base">
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Applying Edits...</>
                                ) : (
                                    <><Wand2 className="mr-2 h-5 w-5" />Apply AI Edit</>
                                )}
                           </Button>
                            {editedImage && (
                                <Button onClick={handleDownload} variant="secondary" className="w-full h-12 text-base">
                                    <Download className="mr-2 h-5 w-5"/> Download Image
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
                      <h2 className="text-2xl font-semibold mb-4">About the AI Photo Editor</h2>
                      <p className="text-muted-foreground leading-relaxed">
                          Unleash your creativity with our AI Photo Editor. This revolutionary tool empowers you to make complex photo edits using simple text commands. Instead of fiddling with sliders and complicated tools, you can just describe the changes you want, and our advanced AI will bring your vision to life. It's like having a professional photo editor at your fingertips, ready to execute your commands instantly.
                          <br /><br />
                          From subtle color corrections to dramatic object removal, the possibilities are endless. Want to change the season in a landscape photo? Or remove a distracting element from a portrait? Just type your request. This tool is perfect for photographers, marketers, social media enthusiasts, and anyone who wants to create stunning images without the steep learning curve of traditional editing software.
                      </p>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">How to Use the AI Photo Editor</h2>
                      <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                          <li><span className="font-semibold text-foreground">Upload Your Image:</span> Click the upload area or drag and drop an image file.</li>
                          <li><span className="font-semibold text-foreground">Describe Your Edit:</span> In the prompt box, type a clear description of the changes you want to make. Be specific for best results (e.g., "Change the color of the car to red," or "Remove the tourists in the background").</li>
                          <li><span className="font-semibold text-foreground">Generate with AI:</span> Click the "Apply AI Edit" button. Our AI will process your request and apply the edits to the image.</li>
                          <li><span className="font-semibold text-foreground">Compare and Download:</span> Use the slider on the resulting image to see a "before and after" comparison. If you're happy with the edit, click "Download Image" to save your new photo.</li>
                          <li><span className="font-semibold text-foreground">Iterate or Start Over:</span> You can apply another edit by changing the prompt and clicking "Apply AI Edit" again, or click "Start Over" to upload a new image.</li>
                      </ol>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                      <ul className="space-y-4 text-muted-foreground">
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Text-Based Editing:</span> Control powerful edits with natural language. No technical skills required.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Object Removal & Addition:</span> Seamlessly remove unwanted objects or add new elements to your photos.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Color & Style Transformation:</span> Change colors, apply artistic styles (e.g., "make it a watercolor painting"), or adjust lighting with simple commands.</div></li>
                        <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Instant Results:</span> See your creative ideas come to life in seconds, not hours.</div></li>
                      </ul>
                  </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What kind of edits can I make?</AccordionTrigger>
                            <AccordionContent>You can perform a wide range of edits, including changing colors, removing or adding objects, altering the background, applying artistic styles, adjusting lighting, and much more. The more creative your prompt, the more interesting the results!</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Are my uploaded images kept private?</AccordionTrigger>
                            <AccordionContent>Yes, your privacy is a top priority. Images are uploaded securely, processed, and then automatically deleted from our servers after a short period. We do not use your images for any other purpose.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Why did my edit not work as expected?</AccordionTrigger>
                            <AccordionContent>The quality of the AI's output depends on the clarity of your prompt and the complexity of the request. Try rephrasing your command to be more specific. For example, instead of "fix the background," try "replace the background with a sunny beach scene."</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Can I edit a specific part of the image?</AccordionTrigger>
                            <AccordionContent>Yes. You can be specific in your prompt, for example: "Only change the color of the red car to blue, leave everything else the same." The AI will do its best to isolate that part of the image for editing.</AccordionContent>
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

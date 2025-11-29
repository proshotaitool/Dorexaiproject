
'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Smile, Trash2, Wand2, Bookmark, Share2, CheckCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function MemeGeneratorPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
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
  
  const toolPath = '/tools/meme-generator';
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
      title: 'Meme Generator',
      text: 'Check out this Meme Generator tool!',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please upload an image.', variant: 'destructive' });
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!image) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    handleDragLeave(e);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleGenerate = async () => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    const img = document.createElement('img');
    
    await new Promise(resolve => {
        img.onload = resolve;
        img.src = image;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const fontSize = canvas.width / 10;
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 20;
    ctx.textAlign = 'center';

    const wrapText = (text: string, y: number, isTop: boolean) => {
        const words = text.toUpperCase().split(' ');
        let line = '';
        let lines = [];
        const maxWidth = canvas.width * 0.9;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        const lineHeight = fontSize * 1.1;
        
        if(isTop) {
            for(let i = 0; i < lines.length; i++) {
                const lineY = y + (i * lineHeight);
                ctx.strokeText(lines[i].trim(), canvas.width / 2, lineY);
                ctx.fillText(lines[i].trim(), canvas.width / 2, lineY);
            }
        } else { // Bottom text
             for(let i = lines.length - 1; i >= 0; i--) {
                const lineY = y - ((lines.length - 1 - i) * lineHeight);
                ctx.strokeText(lines[i].trim(), canvas.width / 2, lineY);
                ctx.fillText(lines[i].trim(), canvas.width / 2, lineY);
            }
        }
    };
    
    if (topText) {
        ctx.textBaseline = 'top';
        const topY = canvas.height * 0.05;
        wrapText(topText, topY, true);
    }
    
    if (bottomText) {
        ctx.textBaseline = 'bottom';
        const bottomY = canvas.height * 0.95;
        wrapText(bottomText, bottomY, false);
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setGeneratedImage(dataUrl);
    toast({ title: 'Meme Generated!', description: 'Your masterpiece is ready to be downloaded.'});
  };

  const handleDownload = async () => {
      if (!generatedImage) return;
      await sessionStorage.setItem('meme-generator-file', generatedImage);
      await sessionStorage.setItem('meme-generator-filename', 'dorex-ai-meme.jpg');
      router.push('/download/meme-generator');
  }
  
  const handleReset = () => {
      setImage(null);
      setGeneratedImage(null);
      setTopText('');
      setBottomText('');
      if(fileInputRef.current) fileInputRef.current.value = '';
  }

  const relatedTools = tools.filter(tool => ['/tools/crop-image'].includes(tool.path));

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
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
              <BreadcrumbPage>Meme Generator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free Online Meme Generator</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Create hilarious memes in seconds with our easy-to-use online tool. Just upload an image, add your top and bottom text, and generate a shareable meme instantly.
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
      {!image ? (
          <Card 
              className={cn('w-full col-span-full max-w-2xl mx-auto flex items-center justify-center transition-colors', isDragging ? 'bg-primary/10' : 'bg-transparent')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
          >
              <CardContent className="p-6 text-center w-full">
              <div className="border-2 border-dashed rounded-xl p-12 hover:border-primary transition-colors cursor-pointer" onClick={handleUploadClick}>
                  <Smile className="mx-auto h-12 w-12 text-muted-foreground" />
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            <Card className='w-full aspect-video flex items-center justify-center overflow-hidden bg-muted/30'>
                <div className="relative w-full h-full">
                    <Image src={generatedImage || image} alt="Meme preview" layout="fill" objectFit="contain" className="rounded-lg" />
                   {!generatedImage && (
                        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                          <div 
                              className="w-full text-center text-white font-extrabold break-words" 
                              style={{ WebkitTextStroke: '2px black', textShadow: '3px 3px 6px black', fontFamily: 'Impact, sans-serif', fontSize: 'clamp(1rem, 8vw, 3rem)' }}
                          >
                              {topText.toUpperCase()}
                          </div>
                          <div 
                              className="w-full text-center text-white font-extrabold break-words" 
                              style={{ WebkitTextStroke: '2px black', textShadow: '3px 3px 6px black', fontFamily: 'Impact, sans-serif', fontSize: 'clamp(1rem, 8vw, 3rem)' }}
                          >
                              {bottomText.toUpperCase()}
                          </div>
                        </div>
                   )}
                </div>
            </Card>
            <div className='space-y-6 lg:sticky lg:top-24'>
              {!generatedImage ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Meme Settings</CardTitle>
                        <CardDescription>Add text to create your meme.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="top-text">Top Text</Label>
                          <Input id="top-text" placeholder="Enter top text" value={topText} onChange={(e) => setTopText(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="bottom-text">Bottom Text</Label>
                           <Input id="bottom-text" placeholder="Enter bottom text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
              ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                        <CardDescription>Your masterpiece is ready!</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">The meme has been generated successfully. You can now download it or start over.</p>
                    </CardContent>
                </Card>
              )}
                <div className="space-y-2">
                    {!generatedImage ? (
                        <Button onClick={handleGenerate} className="w-full h-12 text-base">
                            <Wand2 className="mr-2 h-5 w-5" /> Generate Meme
                        </Button>
                    ) : (
                        <>
                            <Button onClick={handleDownload} className="w-full h-12 text-base">
                                <Download className="mr-2 h-5 w-5" /> Download Meme
                            </Button>
                        </>
                    )}
                    <Button onClick={handleReset} variant="outline" className="w-full h-12 text-base">
                        <Trash2 className="mr-2 h-5 w-5" /> Start New
                    </Button>
                </div>
            </div>
          </div>
        )}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      <section className="mt-16 space-y-8">
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">About the Meme Generator</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Unleash your inner comedian with our simple and fast Meme Generator. This tool lets you easily create classic memes by adding bold, outlined text to the top and bottom of any image. Whether you're reacting to a current event, sharing an inside joke, or just having fun, our generator makes it easy to produce shareable, viral content in seconds.
                        <br/><br/>
                        No need for complicated photo editing software. Just upload your picture, type your captions, and our tool automatically formats the text in the iconic "Impact" font, complete with a white fill and black outline, ensuring your message stands out. It's the perfect tool for social media, group chats, and forums.
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">How to Use the Meme Generator</h2>
                    <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                        <li><span className="font-semibold text-foreground">Upload Image:</span> Start by dragging and dropping or selecting an image file from your device. This will be the background of your meme.</li>
                        <li><span className="font-semibold text-foreground">Add Your Text:</span> Enter your captions in the "Top Text" and "Bottom Text" fields. You'll see a live preview on your image.</li>
                        <li><span className="font-semibold text-foreground">Generate Meme:</span> Click the "Generate Meme" button. This will finalize the text onto the image, creating your meme.</li>
                        <li><span className="font-semibold text-foreground">Download and Share:</span> Once generated, click the "Download Meme" button to save the image to your device and share it with the world!</li>
                    </ol>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                    <ul className="space-y-4 text-muted-foreground">
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Classic Meme Font:</span> Automatically uses the bold, outlined Impact font that is universally recognized for memes.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Live Preview:</span> See how your text looks on the image in real-time as you type.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Instant Generation:</span> Create your final meme with a single click, no waiting required.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Free and Easy:</span> No watermarks, no sign-ups, no complicated tools. Just pure, simple meme creation.</div></li>
                    </ul>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                  <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                          <AccordionTrigger>Can I use a different font or color?</AccordionTrigger>
                          <AccordionContent>This tool is designed to create classic-style memes, so it defaults to the Impact font with white text and a black outline. For more advanced text options, you can use our full Photo Editor tool.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                          <AccordionTrigger>What image formats can I upload?</AccordionTrigger>
                          <AccordionContent>You can upload most common image formats, including JPG, PNG, and GIF. The final output will be a JPG file.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                          <AccordionTrigger>Are there watermarks on the downloaded memes?</AccordionTrigger>
                          <AccordionContent>No, we do not add any watermarks to your creations. The memes you generate are 100% yours.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                          <AccordionTrigger>How is the text sized and placed?</AccordionTrigger>
                          <AccordionContent>The text size is automatically calculated based on the width of your image to ensure it's readable. The top text is anchored to the top, and the bottom text is anchored to the bottom.</AccordionContent>
                      </AccordionItem>
                  </Accordion>
                </CardContent>
            </Card>
      </section>

      <RelatedTools tools={relatedTools} />
    </div>
  );
}

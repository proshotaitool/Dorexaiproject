'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileCode, Download, Loader2, Image as ImageIcon, Globe, Upload, File as FileIcon, Monitor, Tablet, Smartphone, RefreshCw, Bookmark, Share2, CheckCircle } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import html2canvas from 'html2canvas';
import { cn, formatBytes } from '@/lib/utils';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AdUnit } from '@/components/ad-unit';

import { captureUrl } from '@/app/actions/capture-url';

type OutputFormat = 'png' | 'jpeg' | 'webp';
type InputMode = 'code' | 'file' | 'url';
type Viewport = 'desktop' | 'tablet' | 'mobile';

const viewportDimensions: Record<Viewport, { width: number, height: number }> = {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
};

export default function HtmlToImageClient() {
    const router = useRouter();
    const [inputMode, setInputMode] = useState<InputMode>('code');
    const [htmlContent, setHtmlContent] = useState('<h1>Hello, World!</h1>\\n<p>This is a sample HTML snippet.</p>\\n<button style="padding: 8px 16px; border-radius: 4px; background-color: #3b82f6; color: white; border: none;">Click Me</button>');
    const [urlInput, setUrlInput] = useState('https://example.com');
    const [isLoading, setIsLoading] = useState(false);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
    const [quality, setQuality] = useState(90);
    const [delay, setDelay] = useState(0);
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [outputImage, setOutputImage] = useState<{ src: string, size: number, dataUrl: string } | null>(null);

    const { toast } = useToast();

    const { user } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc(userDocRef as any);

    const toolPath = '/tools/html-to-image';
    const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

    const handleFavorite = async () => {
        if (!userDocRef) return;
        try {
            await updateDoc(userDocRef, {
                favoriteTools: isFavorite ? arrayRemove(toolPath) : arrayUnion(toolPath)
            });
            toast({
                title: isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
            });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update favorites.', variant: 'destructive' });
        }
    };

    const handleShare = async () => {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    };

    useEffect(() => {
        setOutputImage(null);
    }, [inputMode, htmlContent, urlInput]);


    const handleCapture = async () => {
        setOutputImage(null);
        setIsLoading(true);

        if (inputMode === 'url') {
            try {
                const { width, height } = viewportDimensions[viewport];
                console.log('Calling captureUrl with:', urlInput, width, height);
                const result = await captureUrl(urlInput, width, height);
                console.log('captureUrl result:', result);

                if (result.success && result.dataUrl) {
                    // Convert base64 to blob to get size
                    const res = await fetch(result.dataUrl);
                    const blob = await res.blob();
                    const imageSrc = URL.createObjectURL(blob);
                    setOutputImage({ src: imageSrc, size: blob.size, dataUrl: result.dataUrl });
                } else {
                    throw new Error(result.error || 'Failed to capture URL');
                }
            } catch (error: any) {
                console.error(error);
                toast({ title: 'Capture Failed', description: error.message || 'Could not capture URL.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        const iframe = document.createElement('iframe');
        const { width, height } = viewportDimensions[viewport];

        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;
        iframe.sandbox = 'allow-scripts allow-same-origin';
        document.body.appendChild(iframe);

        try {
            const iframeDoc = iframe.contentWindow!.document;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            await new Promise(resolve => setTimeout(resolve, 500 + delay * 1000));

            const elementToCapture = iframe.contentWindow?.document.body;

            if (!elementToCapture || elementToCapture.innerHTML === '') {
                throw new Error('Could not load content for capture. Ensure your HTML is valid.');
            }

            const canvas = await html2canvas(elementToCapture, {
                useCORS: true,
                scale: 2,
                allowTaint: true,
                logging: false,
                width,
                height,
                windowWidth: width,
                windowHeight: height,
            });

            const dataUrl = canvas.toDataURL(`image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, `image/${outputFormat}`, outputFormat === 'png' ? undefined : quality / 100));

            if (!blob) throw new Error('Could not create image blob.');

            const imageSrc = URL.createObjectURL(blob);
            setOutputImage({ src: imageSrc, size: blob.size, dataUrl });

        } catch (error: any) {
            console.error(error);
            toast({ title: 'Conversion Failed', description: error.message || 'Could not convert content to image.', variant: 'destructive' });
        } finally {
            document.body.removeChild(iframe);
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!outputImage) return;
        await sessionStorage.setItem('html-to-image-file', outputImage.dataUrl);
        await sessionStorage.setItem('html-to-image-filename', `dorex-ai-capture.${outputFormat}`);
        router.push('/download/html-to-image');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'text/html') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setHtmlContent(e.target?.result as string);
            };
            reader.readAsText(file);
        } else {
            toast({ title: 'Invalid File', description: 'Please upload a .html file.', variant: 'destructive' });
        }
    };

    const isReadyToCapture = htmlContent.trim() !== '';

    const relatedTools = tools.filter(tool => ['/tools/compress-image', '/tools/resize-image'].includes(tool.path));

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
                            <BreadcrumbPage>HTML to Image</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Free HTML to Image Converter</h1>
                <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    Capture a high-quality screenshot of any HTML snippet. Convert your own code into PNG, JPG, or WEBP images.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="lg:sticky lg:top-24 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Input Source</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full space-y-4">
                                <div className="grid w-full grid-cols-3 bg-muted p-1 rounded-md">
                                    <button
                                        onClick={() => setInputMode('code')}
                                        className={cn(
                                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                            inputMode === 'code' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <FileCode className="mr-2 h-4 w-4" />Code
                                    </button>
                                    <button
                                        onClick={() => setInputMode('file')}
                                        className={cn(
                                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                            inputMode === 'file' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />File
                                    </button>
                                    <button
                                        onClick={() => setInputMode('url')}
                                        className={cn(
                                            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                            inputMode === 'url' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
                                        )}
                                    >
                                        <Globe className="mr-2 h-4 w-4" />URL
                                    </button>
                                </div>

                                {inputMode === 'code' && (
                                    <div className="pt-2">
                                        <Textarea placeholder="<div>Your HTML here</div>" className="min-h-[150px] font-mono" value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} />
                                    </div>
                                )}

                                {inputMode === 'file' && (
                                    <div className="pt-2">
                                        <Input type="file" accept=".html" onChange={handleFileChange} />
                                    </div>
                                )}

                                {inputMode === 'url' && (
                                    <div className="pt-2">
                                        <Input type="url" placeholder="https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                                        <p className="text-xs text-muted-foreground mt-2">Enter the full URL of the webpage you want to capture.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Capture Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Viewport</Label>
                                <Tabs value={viewport} onValueChange={(v) => setViewport(v as Viewport)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="desktop"><Monitor /> Desktop</TabsTrigger>
                                        <TabsTrigger value="tablet"><Tablet /> Tablet</TabsTrigger>
                                        <TabsTrigger value="mobile"><Smartphone /> Mobile</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div className="space-y-2">
                                <Label>Output Format</Label>
                                <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="jpeg">JPEG</SelectItem>
                                        <SelectItem value="webp">WEBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quality ({quality})</Label>
                                <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} disabled={outputFormat === 'png'} />
                            </div>
                            <div className="space-y-2">
                                <Label>Capture Delay ({delay}s)</Label>
                                <Slider value={[delay]} onValueChange={([v]) => setDelay(v)} max={5} step={0.5} />
                            </div>
                            <Button onClick={handleCapture} disabled={isLoading || !isReadyToCapture} className="w-full h-12 text-base">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ImageIcon className="mr-2 h-5 w-5" />}
                                {isLoading ? 'Capturing...' : 'Capture Image'}
                            </Button>
                        </CardContent>
                    </Card>
                    <AdUnit slotId="html-to-image-sidebar" className="w-full" />
                </div>

                <Card className="min-h-[600px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Result</CardTitle>
                        <CardDescription>Your captured image will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-b-lg p-4">
                        {isLoading ? (
                            <div className="text-center text-muted-foreground p-8">
                                <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                                <p className="mt-4 font-medium">Capturing content, please wait...</p>
                            </div>
                        ) : outputImage ? (
                            <div className="text-center space-y-4">
                                <img src={outputImage.src} alt="Generated output" className="max-w-full border-2 rounded-md shadow-lg mx-auto" style={{ maxHeight: '400px' }} />
                                <div className='text-sm text-muted-foreground'>File size: {formatBytes(outputImage.size)}</div>
                                <Button onClick={handleDownload} size="lg"><Download className="mr-2" />Download Image</Button>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <ImageIcon className="h-16 w-16 mx-auto" />
                                <p className="mt-4 font-medium">Your capture result will be displayed here.</p>
                                <p className="text-sm">Configure your settings and click "Capture Image".</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <section className="mt-16 space-y-8">
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">About the HTML to Image Tool</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our HTML to Image converter is a powerful utility for developers, designers, and marketers who need to capture a visual representation of web content. This tool takes raw HTML code or an HTML file and renders it in a virtual browser, then takes a high-quality screenshot. It's perfect for creating email thumbnails, generating social media preview images for your web pages, or documenting visual changes during development.
                            <br /><br />
                            By rendering the content in a sandboxed environment, we can accurately capture complex layouts, CSS styles, and even JavaScript-driven elements. You have full control over the viewport size, output format, and quality, ensuring the final image meets your exact requirements.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to Convert HTML to an Image</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Choose Input Method:</span> Select whether to paste HTML code directly or upload an HTML file.</li>
                            <li><span className="font-semibold text-foreground">Configure Capture Settings:</span> Select the desired viewport size (Desktop, Tablet, or Mobile), the output image format (PNG, JPEG, WEBP), and adjust the quality.</li>
                            <li><span className="font-semibold text-foreground">Set a Capture Delay (Optional):</span> If your HTML contains animations or scripts that need time to run, set a delay (in seconds) to ensure all content is loaded before the screenshot is taken.</li>
                            <li><span className="font-semibold text-foreground">Capture Image:</span> Click the "Capture Image" button to start the conversion process.</li>
                            <li><span className="font-semibold text-foreground">Download Your Image:</span> Once the capture is complete, a preview will appear. Click "Download Image" to save your file.</li>
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                        <ul className="space-y-4 text-muted-foreground">
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Accurate Rendering:</span> Captures HTML, CSS, and JavaScript just as they would appear in a browser.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Responsive Viewports:</span> Preview and capture your content in desktop, tablet, or mobile sizes.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Multiple Formats:</span> Choose between PNG, JPEG, and WEBP for your output image.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Animation Support:</span> Use the delay feature to capture content after animations have finished.</div></li>
                            <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Secure & Private:</span> All rendering is done in-browser. Your code is never sent to our servers.</div></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Why can't I capture an image from a URL?</AccordionTrigger>
                                <AccordionContent>For security reasons (CORS policies), browsers prevent websites from directly capturing content from other domains. This tool focuses on rendering HTML code that you provide, which is a more reliable and secure method.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Why does my captured image look slightly different from my browser?</AccordionTrigger>
                                <AccordionContent>Rendering can vary slightly based on the fonts installed on a system and subtle differences in browser rendering engines. Our tool uses a standardized environment to produce consistent results.</AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Can I capture content that requires login?</AccordionTrigger>
                                <AccordionContent>Since the rendering happens in a sandboxed environment, it cannot access your logged-in sessions. To capture authenticated content, you would need to save the page's HTML source code after logging in and then upload it using the "File" input option.</AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </section>

            <RelatedTools tools={relatedTools} />
        </div>
    );
}

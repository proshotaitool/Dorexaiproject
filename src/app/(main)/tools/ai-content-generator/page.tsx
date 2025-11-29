
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Clipboard, Loader2, Sparkles, Bookmark, Share2, CheckCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { generateContent } from '@/ai/flows/ai-content-generator-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Background3D } from '@/components/background-3d';

import { UserProfile } from '@/types';

export default function AiContentGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef as any);

  const toolPath = '/tools/ai-content-generator';
  const isFavorite = userProfile?.favoriteTools?.includes(toolPath);

  const hasStarted = prompt.trim() !== '';

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
      title: 'AI Content Generator',
      text: 'Check out this AI Content Generator tool!',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  const handleGenerate = async () => {
    if (!hasStarted) return;

    setIsLoading(true);
    setGeneratedContent('');
    try {
      const result = await generateContent({ prompt });
      setGeneratedContent(result.content);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not generate content.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard.',
    });
  };

  const relatedTools = tools.filter(tool => ['/tools/text-summarization'].includes(tool.path));

  return (

    <div className="relative min-h-screen overflow-hidden">
      <Background3D />
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
                <BreadcrumbLink href="/tools/text-ai">Text &amp; AI Tools</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>AI Content Generator</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">AI Content Generator</h1>
          <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Generate high-quality text content for any purpose. Describe what you need, from blog posts and emails to marketing copy and creative stories, and let our AI do the writing for you.
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Your Prompt</CardTitle>
              <CardDescription>Describe the content you want to generate. Be as specific as possible for the best results.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                placeholder="e.g., 'Write a blog post about the benefits of remote work' or 'Generate three marketing taglines for a new coffee brand'"
                className="flex-1 text-base resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button onClick={handleGenerate} disabled={isLoading || !hasStarted} className="mt-4 w-full h-12 text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2" /> Generated Content
              </CardTitle>
              <CardDescription>The AI-generated content will appear here. You can edit it or copy it to your clipboard.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isLoading && (
                <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-dashed border-2">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>AI is writing...</span>
                  </div>
                </div>
              )}
              {generatedContent && !isLoading && (
                <div className="relative flex-1">
                  <Textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} className="h-full resize-none text-base bg-muted/50" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleCopyToClipboard}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!generatedContent && !isLoading && (
                <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-dashed border-2">
                  <div className="text-center text-muted-foreground">
                    <Sparkles className="mx-auto h-12 w-12" />
                    <p className="mt-2">Your content will be generated here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <section className="mt-16 space-y-8">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">About the AI Content Generator</h2>
              <p className="text-muted-foreground leading-relaxed">
                The AI Content Generator is your creative partner for overcoming writer's block and accelerating your content creation process. Powered by advanced language models, this tool can understand your requirements and generate high-quality, human-like text on almost any topic. Whether you need a full blog post, catchy marketing slogans, a professional email, or creative story ideas, our AI is here to help.
                <br /><br />
                By providing a clear and specific prompt, you guide the AI to produce content that fits your tone, style, and objectives. It's an invaluable tool for marketers, writers, students, and business owners who need to produce compelling content efficiently. Save time on brainstorming and drafting, and focus on refining your message.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">How to Use the Content Generator</h2>
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                <li><span className="font-semibold text-foreground">Enter Your Prompt:</span> In the "Your Prompt" box, describe the content you want to generate. Be as specific as possible. For example, instead of "write about coffee," try "Write a 300-word blog post about the benefits of single-origin arabica coffee for home brewing."</li>
                <li><span className="font-semibold text-foreground">Generate Content:</span> Click the "Generate Content" button and let our AI work its magic. The process usually takes just a few seconds.</li>
                <li><span className="font-semibold text-foreground">Review and Refine:</span> The generated text will appear in the "Generated Content" panel. You can edit the text directly in the box to make adjustments.</li>
                <li><span className="font-semibold text-foreground">Copy to Clipboard:</span> Once you're satisfied, use the copy button to quickly grab the content for use in your project.</li>
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Versatile Content Creation:</span> Generate anything from blog posts and social media updates to emails and ad copy.</div></li>
                <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Overcome Writer's Block:</span> Instantly get ideas and a first draft to kickstart your writing process.</div></li>
                <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Time-Saving:</span> Drastically reduce the time it takes to research, outline, and write content.</div></li>
                <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Customizable Tone & Style:</span> Guide the AI by including tone instructions in your prompt (e.g., "write in a professional tone" or "make it funny and casual").</div></li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is the generated content original?</AccordionTrigger>
                  <AccordionContent>Yes, the AI generates new content based on your prompt and its training data. However, it's always a good practice to check for plagiarism, especially for academic or professional use.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How can I get the best results?</AccordionTrigger>
                  <AccordionContent>The key is a detailed prompt. Include the topic, desired format (e.g., blog post, list), tone (e.g., formal, witty), target audience, and any key points you want to include.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I use the generated content for commercial purposes?</AccordionTrigger>
                  <AccordionContent>Yes, you are free to use the content generated for your personal and commercial projects. You own the output you create.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What languages does the AI support?</AccordionTrigger>
                  <AccordionContent>Our AI model is primarily trained on English but has capabilities in many other languages. You can try writing your prompt in another language to see the results.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
        <RelatedTools tools={relatedTools} />
      </div>
    </div>

  );
}

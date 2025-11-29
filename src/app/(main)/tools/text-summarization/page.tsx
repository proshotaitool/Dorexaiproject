
'use client';

import { useState, useMemo } from 'react';
import { summarizeText } from '@/ai/flows/text-summarization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Clipboard, Loader2, Type, Bookmark, Share2, CheckCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { OutOfCreditsDialog } from '@/components/out-of-credits-dialog';
import { deductCredit } from '@/lib/credits';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function TextSummarizationPage() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef as any);

  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  
  const toolPath = '/tools/text-summarization';
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
      title: 'Text Summarizer',
      text: 'Check out this AI Text Summarizer tool!',
      url: window.location.href,
    };
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link Copied!', description: 'Tool URL copied to clipboard.' });
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Input needed',
        description: 'Please enter some text to summarize.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSummary('');
    try {
      const result = await summarizeText({ text: inputText });
      setSummary(result.summary);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to summarize text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if(!summary) return;
    navigator.clipboard.writeText(summary);
    toast({
        title: 'Copied!',
        description: 'Summary copied to clipboard.',
    });
  };
  
  const hasStarted = inputText.trim() !== '';

  const relatedTools = tools.filter(tool => ['/tools/ai-content-generator'].includes(tool.path));

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
              <BreadcrumbLink href="/tools/text-ai">Text &amp; AI Tools</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Text Summarizer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">AI Text Summarizer</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Instantly condense long articles, papers, or documents into a concise and easy-to-read summary with our advanced AI. Save time and get the key points in seconds.
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
            <Card>
              <CardHeader>
                <CardTitle>Your Text</CardTitle>
                <CardDescription>Enter the text you want to summarize.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your article, report, or any long text here..."
                  className="min-h-[400px] text-base"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <Button onClick={handleSummarize} disabled={isLoading || !hasStarted} className="mt-4 w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    'Summarize Text'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col min-h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2" /> AI Summary
                </CardTitle>
                <CardDescription>The summarized version of your text will appear here.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {isLoading && (
                  <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-dashed border-2">
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Generating summary...</span>
                     </div>
                  </div>
                )}
                {summary && !isLoading && (
                  <div className="flex-1 flex flex-col">
                    <div className="relative flex-1">
                        <Textarea value={summary} readOnly className="h-full resize-none text-base bg-muted/50" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleCopyToClipboard}
                        >
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                )}
                {!summary && !isLoading && (
                    <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg border-dashed border-2">
                        <div className="text-center text-muted-foreground">
                            <Type className="mx-auto h-12 w-12" />
                            <p className="mt-2">Your summary will be generated here.</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
          <section className="mt-16 space-y-8">
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">About the AI Text Summarizer</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        In a world of information overload, the AI Text Summarizer is your key to efficiency. This powerful tool uses advanced artificial intelligence to read, understand, and condense long pieces of text into short, easy-to-digest summaries. Whether you're a student tackling a research paper, a professional trying to keep up with industry reports, or just someone curious to learn faster, our summarizer helps you get to the core of the matter in seconds.
                        <br /><br />
                        Simply paste your text, and let the AI identify the key points, main arguments, and crucial information, presenting it to you in a concise format. It's the perfect way to save time without sacrificing knowledge.
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">How to Use the AI Text Summarizer</h2>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li><span className="font-semibold text-foreground">Paste Your Text:</span> Copy your original content and paste it into the "Your Text" input box on the left.</li>
                        <li><span className="font-semibold text-foreground">Summarize with AI:</span> Click the "Summarize Text" button to let our artificial intelligence analyze and condense the content.</li>
                        <li><span className="font-semibold text-foreground">Get Your Summary:</span> The concise, AI-generated summary will appear in the "AI Summary" panel on the right.</li>
                        <li><span className="font-semibold text-foreground">Copy and Use:</span> Use the copy button to quickly grab the summary for your notes, reports, or social media posts.</li>
                    </ol>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 md:p-8">
                    <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                    <ul className="space-y-4 text-muted-foreground">
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Save Time:</span> Instantly get the main points of long texts without reading everything.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Improve Comprehension:</span> Quickly understand the core message of complex documents.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Boost Productivity:</span> Accelerate your research and learning process.</div></li>
                      <li className="flex items-start"><CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /><div><span className="font-semibold text-foreground">Free and Accessible:</span> No subscriptions or complicated setups required. Just paste and summarize.</div></li>
                    </ul>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                  <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                          <AccordionTrigger>What kind of text can I summarize?</AccordionTrigger>
                          <AccordionContent>You can summarize almost any text, including news articles, blog posts, research papers, emails, and reports. For best results, use text that is well-structured.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                          <AccordionTrigger>Is there a character limit?</AccordionTrigger>
                          <AccordionContent>While the tool can handle very long texts, summaries are most effective for content up to a few thousand words. For extremely long documents, consider summarizing them in sections.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                          <AccordionTrigger>How accurate is the summary?</AccordionTrigger>
                          <AccordionContent>Our AI is trained to identify and extract the most important information. While it is highly accurate, it's always a good practice to skim the original document for critical details if you're using the summary for academic or professional purposes.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                          <AccordionTrigger>Is my data safe?</AccordionTrigger>
                          <AccordionContent>Yes, your privacy is important to us. The text you enter is processed securely and is not stored on our servers after the summary is generated.</AccordionContent>
                      </AccordionItem>
                  </Accordion>
                </CardContent>
            </Card>
          </section>
          <RelatedTools tools={relatedTools} />
      <OutOfCreditsDialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
    </div>
  );
}

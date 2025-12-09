'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Copy, Hash, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTagsAction } from '@/app/actions/youtube-tags';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function YoutubeTagGeneratorPage() {
    const [keyword, setKeyword] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!keyword.trim()) {
            toast({ title: 'Error', description: 'Please enter a keyword or video title', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setTags([]);
        setCopied(false);

        try {
            const result = await generateTagsAction(keyword);
            if (result.success && result.data) {
                setTags(result.data);
                toast({ title: 'Success', description: 'Tags generated successfully!' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to generate tags', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (tags.length === 0) return;
        const tagsString = tags.join(', ');
        navigator.clipboard.writeText(tagsString);
        setCopied(true);
        toast({ title: 'Copied', description: 'Tags copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container py-8 md:py-12">
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
                            <BreadcrumbLink href="/tools/text-ai">Text & AI</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Tag Generator</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Tag Generator</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Boost your video SEO with AI-generated, high-ranking tags. Just enter your video title or topic.
                </p>
            </div>

            <Card className="mb-8 max-w-3xl mx-auto">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="e.g., How to make pasta, Funny cat compilation"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Hash className="mr-2 h-4 w-4" />
                                    Generate Tags
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {tags.length > 0 && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Generated Tags ({tags.length})</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full bg-background border border-border text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors cursor-default"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground font-mono break-all">
                                {tags.join(', ')}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

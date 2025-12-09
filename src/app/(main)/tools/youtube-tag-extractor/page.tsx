'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Copy, Search, Check, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractYoutubeTags } from '@/app/actions/get-youtube-tags';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

export default function YoutubeTagExtractorPage() {
    const [url, setUrl] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedSelected, setCopiedSelected] = useState(false);
    const { toast } = useToast();

    const handleExtract = async () => {
        if (!url.trim()) {
            toast({ title: 'Error', description: 'Please enter a YouTube URL', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setTags([]);
        setSelectedTags([]);
        setCopiedAll(false);
        setCopiedSelected(false);

        try {
            const result = await extractYoutubeTags(url);
            if (result.success && result.data) {
                setTags(result.data);
                toast({ title: 'Success', description: 'Tags extracted successfully!' });
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to extract tags', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const toggleTagSelection = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleCopyAll = () => {
        if (tags.length === 0) return;
        const tagsString = tags.join(', ');
        navigator.clipboard.writeText(tagsString);
        setCopiedAll(true);
        toast({ title: 'Copied', description: 'All tags copied to clipboard!' });
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleCopySelected = () => {
        if (selectedTags.length === 0) {
            toast({ title: 'Info', description: 'Select tags to copy first.', variant: 'default' });
            return;
        }
        const tagsString = selectedTags.join(', ');
        navigator.clipboard.writeText(tagsString);
        setCopiedSelected(true);
        toast({ title: 'Copied', description: 'Selected tags copied to clipboard!' });
        setTimeout(() => setCopiedSelected(false), 2000);
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
                            <BreadcrumbPage>Tag Extractor</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter sm:text-5xl">YouTube Tag Extractor</h1>
                <p className="mt-2 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
                    Reveal the hidden tags and keywords used in any YouTube video. Analyze competitor strategies instantly.
                </p>
            </div>

            <Card className="mb-8 max-w-3xl mx-auto">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Paste YouTube URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                        />
                        <Button onClick={handleExtract} disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Extract Tags
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {tags.length > 0 && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Extracted Tags ({tags.length})</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCopySelected} disabled={selectedTags.length === 0} className="gap-2">
                                    {copiedSelected ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copiedSelected ? 'Copied!' : `Copy Selected (${selectedTags.length})`}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleCopyAll} className="gap-2">
                                    {copiedAll ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copiedAll ? 'Copied!' : 'Copy All'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => {
                                        const isSelected = selectedTags.includes(tag);
                                        return (
                                            <span
                                                key={index}
                                                onClick={() => toggleTagSelection(tag)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full border text-sm font-medium transition-all cursor-pointer select-none",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                                                        : "bg-background border-border hover:border-primary/50 hover:text-primary"
                                                )}
                                            >
                                                {tag}
                                            </span>
                                        );
                                    })}
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

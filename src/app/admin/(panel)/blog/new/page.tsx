
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Image as ImageIcon, Eye, Pen, Copy, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBlogPosts, type BlogPost } from '@/hooks/useBlogPosts';

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addPost } = useBlogPosts();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setContentImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Image URL copied to clipboard.' });
  }

  const removeContentImage = (index: number) => {
    setContentImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleSave = async (publishStatus: 'Published' | 'Draft') => {
    if (!title || !category || !content || !featuredImage) {
        toast({
            title: 'Missing Fields',
            description: 'Please fill out title, category, content and add a featured image.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSaving(true);
    try {
        await addPost({
            title,
            category,
            status: publishStatus,
            imageUrl: featuredImage,
            imageHint: 'custom',
            content,
        });
        
        toast({
          title: `Post ${publishStatus === 'Published' ? 'Published' : 'Saved as Draft'}`,
          description: 'Your new blog post has been saved.',
        });
        router.push('/admin/blog');
    } catch (error) {
        console.error(error);
        toast({
            title: 'Error',
            description: 'Failed to save the post.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  };
    
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/blog">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">Create New Post</h1>
                    <p className="text-admin-muted-foreground">Compose a new article for your blog.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSaving}>Save as Draft</Button>
                <Button onClick={() => handleSave('Published')} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Publish Post
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Post Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="post-title" className="text-lg">Title</Label>
                            <Input id="post-title" placeholder="Your amazing blog post title" className="h-12 text-lg" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="post-content" className="text-lg">Content</Label>
                             <Tabs defaultValue="write">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="write"><Pen className="mr-2 h-4 w-4"/> Write</TabsTrigger>
                                    <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4"/> Preview</TabsTrigger>
                                </TabsList>
                                <TabsContent value="write" className="mt-4">
                                    <Textarea 
                                        id="post-content" 
                                        placeholder="Start writing your masterpiece here... HTML and Markdown are supported." 
                                        className="min-h-[400px] text-base font-mono"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </TabsContent>
                                <TabsContent value="preview" className="mt-4">
                                    <div className="min-h-[400px] w-full rounded-md border border-input bg-muted/50 overflow-y-auto">
                                        {content ? (
                                            <iframe
                                                srcDoc={`<style>body { font-family: sans-serif; padding: 1rem; color: #333; } img { max-width: 100%; height: auto; border-radius: 0.5rem; } a { color: #3b82f6; }</style>${content}`}
                                                className="w-full h-[400px] border-0"
                                                sandbox=""
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                                Preview will appear here
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Content Images</CardTitle>
                        <CardDescription>Upload images to use within your post content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button variant="outline" className="w-full" onClick={() => document.getElementById('content-image-upload')?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Content Images
                         </Button>
                         <Input type="file" id="content-image-upload" onChange={handleContentImageChange} accept="image/*" className="hidden" multiple />
                         {contentImages.length > 0 && (
                             <div className="grid grid-cols-3 gap-4">
                                 {contentImages.map((imgSrc, index) => (
                                     <div key={index} className="relative group">
                                         <Image src={imgSrc} alt={`Content image ${index + 1}`} width={100} height={100} className="w-full h-auto object-cover rounded-md" />
                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button size="icon" variant="secondary" onClick={() => copyToClipboard(imgSrc)}><Copy className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="destructive" onClick={() => removeContentImage(index)}><Trash2 className="h-4 w-4"/></Button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>SEO Settings</CardTitle>
                        <CardDescription>Optimize your post for search engines.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meta-title">Meta Title</Label>
                            <Input id="meta-title" placeholder="A catchy title for search results"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta-description">Meta Description</Label>
                            <Textarea id="meta-description" placeholder="A short, engaging summary for search results."/>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
                <Card>
                    <CardHeader>
                        <CardTitle>Post Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as 'Published' | 'Draft')}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Input placeholder="e.g., AI, Productivity" value={category} onChange={e => setCategory(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label>Author</Label>
                            <Input value="Admin" disabled />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Featured Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="relative w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById('featured-image-upload')?.click()}>
                            {featuredImage ? (
                                <Image src={featuredImage} alt="Preview" fill className="object-cover" />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                    <ImageIcon className="h-10 w-10 mx-auto"/>
                                    <p className="mt-2 text-sm">Click to upload</p>
                                </div>
                            )}
                        </div>
                        <Input type="file" id="featured-image-upload" onChange={handleFeaturedImageChange} accept="image/*" className="hidden" />
                         <div className="space-y-2">
                            <Label>Image Placement</Label>
                            <RadioGroup defaultValue="standard" className="flex gap-4">
                                <Label htmlFor="placement-standard" className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="standard" id="placement-standard"/>Standard</Label>
                                <Label htmlFor="placement-full" className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="full" id="placement-full"/>Full Width</Label>
                                <Label htmlFor="placement-hide" className="flex items-center gap-2 cursor-pointer text-sm"><RadioGroupItem value="hide" id="placement-hide"/>Hide</Label>
                            </RadioGroup>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

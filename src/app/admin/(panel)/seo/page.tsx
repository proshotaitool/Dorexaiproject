
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Search, CheckCircle, XCircle, FileWarning, Loader2, Save } from 'lucide-react';
import { tools } from '@/lib/tools';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SeoOverride {
  id: string; // The URL-encoded path
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

type PageData = {
  name: string;
  path: string;
};

const allPages: PageData[] = [
  // Main Pages
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact Us', path: '/contact' },
  { name: 'Pricing', path: '/pricing' },
  // Hub Pages
  { name: 'All Tools Page', path: '/tools' },
  { name: 'Image Tools Hub', path: '/tools/image' },
  { name: 'PDF Tools Hub', path: '/tools/pdf' },
  { name: 'Text & AI Tools Hub', path: '/tools/text-ai' },
  { name: 'Premium Tools Hub', path: '/premium' },
  // Legal Pages
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms of Service', path: '/terms-of-service' },
  { name: 'Cookie Policy', path: '/cookie-policy' },
  // Tool pages
  ...tools.map((tool) => ({ name: tool.name, path: tool.path }))
];

const SeoEditDialog = ({ page, seoData, open, onOpenChange, onSave }: { page: PageData | null; seoData?: SeoOverride | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (data: Omit<SeoOverride, 'id'>) => Promise<void> }) => {
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (page) {
      setMetaTitle(seoData?.metaTitle || page.name);
      setMetaDescription(seoData?.metaDescription || `Description for ${page.name}`);
      setKeywords(seoData?.keywords || '');
    }
  }, [page, seoData]);

  if (!page) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await onSave({ metaTitle, metaDescription, keywords });
        toast({ title: 'Success', description: `SEO settings for ${page.name} saved.` });
        onOpenChange(false);
    } catch(e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to save SEO settings.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editing SEO for: {page.name}</DialogTitle>
          <DialogDescription>
            Optimize how this page appears on search engine results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 flex-1 overflow-y-auto pr-6">
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Core SEO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="meta-title">Meta Title</Label>
                            <Input id="meta-title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta-description">Meta Description</Label>
                            <Textarea id="meta-description" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                            <Input id="keywords" placeholder="e.g., image compressor, free tools, AI" value={keywords} onChange={e => setKeywords(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6 sticky top-0">
                <Card>
                    <CardHeader>
                        <CardTitle>Google Preview</CardTitle>
                        <CardDescription>How this page will appear in Google search.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg">
                            <p className="text-sm text-gray-500 truncate">https://proshot.ai{page.path}</p>
                            <h4 className="text-blue-700 text-xl mt-1 truncate">{metaTitle || "Your Meta Title Will Appear Here"}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {metaDescription || "Your meta description will appear here. Write a compelling summary to attract users."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SeoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);

  const firestore = useFirestore();
  const seoCollection = useMemo(() => firestore ? collection(firestore, 'seo-overrides') : null, [firestore]);
  const { data: seoOverrides, isLoading } = useCollection<SeoOverride>(seoCollection);

  const allPagesWithSeo = useMemo(() => {
    if (isLoading) return [];
    return allPages.map(page => {
      const seoData = seoOverrides.find(s => s.id === encodeURIComponent(page.path));
      return {
        ...page,
        metaTitle: !!seoData?.metaTitle,
        metaDescription: !!seoData?.metaDescription,
        seoData,
      }
    })
  }, [seoOverrides, isLoading]);

  const missingTitlePages = allPagesWithSeo.filter(p => !p.metaTitle);
  const missingDescriptionPages = allPagesWithSeo.filter(p => !p.metaDescription);
  const optimizedPages = allPagesWithSeo.filter(p => p.metaTitle && p.metaDescription);
  const nonOptimizedPages = allPagesWithSeo.filter(p => !p.metaTitle || !p.metaDescription);
  const seoScore = Math.round((optimizedPages.length / allPages.length) * 100);

  const handleEditClick = (page: PageData, seoData?: SeoOverride | null) => {
    setEditingPage({ ...page, seoData });
    setIsDialogOpen(true);
  }

  const handleSaveSeo = async (data: Omit<SeoOverride, 'id'>) => {
    if (!firestore || !editingPage) return;
    const docId = encodeURIComponent(editingPage.path);
    const docRef = doc(firestore, 'seo-overrides', docId);
    await setDoc(docRef, data, { merge: true });
  };
  
  const filterPages = (pages: any[]) => {
    if (!searchTerm) return pages;
    return pages.filter(page => 
        page.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        page.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SEO Dashboard</h1>
          <p className="text-admin-muted-foreground">Monitor and improve your site's search engine performance.</p>
        </div>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>SEO Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                   <div className="relative h-32 w-32">
                        <svg className="absolute inset-0" viewBox="0 0 36 36">
                            <path
                                className="text-admin-muted"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className="text-primary"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${seoScore}, 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                           {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <span className="text-4xl font-bold">{seoScore}</span>}
                        </div>
                   </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Site Audit</CardTitle>
                    <CardDescription>Issues that need your attention.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <FileWarning className="h-6 w-6 text-red-500" />
                        <div className="flex-1">
                            <p className="font-semibold">{isLoading ? '...' : missingTitlePages.length} Pages with Missing Meta Titles</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <FileWarning className="h-6 w-6 text-orange-500" />
                        <div className="flex-1">
                            <p className="font-semibold">{isLoading ? '...' : missingDescriptionPages.length} Pages with Missing Meta Descriptions</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
       </div>

       <Card>
            <CardHeader>
                <CardTitle>Page Optimization Status</CardTitle>
                <CardDescription>Search and edit SEO settings for any page.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
                    <Input 
                        placeholder="Search all pages..." 
                        className="pl-10 h-10 w-full max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-red-600">Pages Missing SEO</h3>
                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                       {filterPages(nonOptimizedPages).map(page => (
                            <div key={page.path} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{page.name}</p>
                                    <p className="text-sm text-admin-muted-foreground">{page.path}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(page, page.seoData)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Optimize
                                </Button>
                            </div>
                        ))}
                    </div>
                  </div>
                   <div>
                    <h3 className="font-semibold mb-2 text-green-600">Optimized Pages</h3>
                     <div className="border rounded-lg max-h-96 overflow-y-auto">
                       {filterPages(optimizedPages).map(page => (
                            <div key={page.path} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                <div>
                                    <p className="font-medium">{page.name}</p>
                                    <p className="text-sm text-admin-muted-foreground">{page.path}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(page, page.seoData)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
                )}
            </CardContent>
       </Card>

       <SeoEditDialog page={editingPage} seoData={editingPage?.seoData} open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSaveSeo} />
    </div>
  );
}


'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Globe, FileText, Landmark, Search, Wrench } from 'lucide-react';
import { tools } from '@/lib/tools';

const pageCategories = {
  'Main Pages': {
    icon: Globe,
    pages: [
      { name: 'Homepage', path: '/' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Pricing', path: '/pricing' },
    ],
  },
  'Hub Pages': {
    icon: FileText,
    pages: [
      { name: 'All Tools Page', path: '/tools' },
      { name: 'Image Tools Hub', path: '/tools/image' },
      { name: 'PDF Tools Hub', path: '/tools/pdf' },
      { name: 'Text & AI Tools Hub', path: '/tools/text-ai' },
      { name: 'Premium Tools Hub', path: '/premium' },
    ],
  },
  'Individual Tool Pages': {
    icon: Wrench,
    pages: tools.map(tool => ({ name: tool.name, path: tool.path })),
  },
  'Legal Pages': {
    icon: Landmark,
    pages: [
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Terms of Service', path: '/terms-of-service' },
    ],
  },
};

export default function WebsiteEditorPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = Object.entries(pageCategories).map(([category, { icon, pages }]) => {
    const filteredPages = pages.filter(page =>
      page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { category, icon, pages: filteredPages };
  }).filter(category => category.pages.length > 0);
  
  const pathToId = (path: string) => {
    if (path === '/') return 'home';
    return path.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Website Editor</h1>
          <p className="text-admin-muted-foreground">Update content across your website's main pages.</p>
        </div>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
        <Input 
          placeholder="Search pages..." 
          className="pl-10 h-10 w-full max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(({ category, icon: Icon, pages }) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-6 w-6" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-admin-border">
                  {pages.map(page => (
                    <div key={page.path} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{page.name}</p>
                        <p className="text-sm text-admin-muted-foreground">{page.path}</p>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/admin/website-editor/edit/${pathToId(page.path)}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
                <Search className="mx-auto h-12 w-12 text-admin-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Pages Found</h3>
                <p className="mt-2 text-sm text-admin-muted-foreground">Your search for "{searchTerm}" did not match any pages.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

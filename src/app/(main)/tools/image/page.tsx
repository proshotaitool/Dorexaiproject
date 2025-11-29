
'use client';

import { useState, useMemo } from 'react';
import { ToolCard } from '@/components/tool-card';
import { Search } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToolManager } from '@/hooks/useToolManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Background3D } from '@/components/background-3d';

export default function ImageToolsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const { managedTools, isLoading } = useToolManager();

  const allImageTools = useMemo(() => {
    return managedTools.filter(tool => tool.category === 'Image' && tool.enabled);
  }, [managedTools]);

  const filteredTools = useMemo(() => {
    return allImageTools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allImageTools, searchTerm]);

  return (

    <div className="relative min-h-screen overflow-hidden">
      <Background3D />
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
                <BreadcrumbPage>Image Tools</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Image Tools</h1>
          <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Welcome to our comprehensive suite of image editing and manipulation tools. Here you can find everything you need to compress, resize, convert, crop, and enhance your images. Whether you're a professional designer or just looking to touch up a photo, our tools are designed to be powerful yet easy to use.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <SearchBar />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.path} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Tools Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your search for "{searchTerm}" did not match any image tools.</p>
          </div>
        )}
      </div>
    </div>
  );

}


'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToolCard } from '@/components/tool-card';
import { Button } from '@/components/ui/button';
import { ToolCategory } from '@/lib/tools';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToolManager, ManagedTool } from '@/hooks/useToolManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Background3D } from '@/components/background-3d';

const categories: ToolCategory[] = ['Image', 'PDF', 'Text & AI', 'Premium'];

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<ToolCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const { managedTools, isLoading } = useToolManager();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    } else {
      setSearchTerm('');
    }
  }, [searchParams]);

  const filteredTools = managedTools.filter(tool => {
    if (!tool.enabled) return false;
    const categoryMatch = filter === 'All' || tool.category === filter;
    const searchMatch = searchTerm === '' || tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const groupedTools = filteredTools.reduce((acc, tool) => {
    const category = tool.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, ManagedTool[]>);

  const displayedCategories = filter === 'All'
    ? categories.filter(c => groupedTools[c]?.length > 0)
    : categories.filter(c => c === filter && groupedTools[c]?.length > 0);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background3D />
      <div className="container py-12">
        <Breadcrumb className="mb-8 flex justify-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tools</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">All Tools</h1>
          <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
            Find the perfect tool for your task. Search and filter through our comprehensive suite of digital utilities.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar />
        </div>

        <div className="flex items-center justify-center gap-2 overflow-x-auto p-2 mb-12">
          <Button
            variant={filter === 'All' ? 'secondary' : 'ghost'}
            className="rounded-full"
            onClick={() => setFilter('All')}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filter === category ? 'secondary' : 'ghost'}
              className="rounded-full"
              onClick={() => setFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        {isLoading ? (
          <div className="space-y-12">
            {[...Array(2)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-48 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
            <Search className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Tools Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your search for "{searchTerm}" did not match any tools.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {displayedCategories.map((category) => (
              groupedTools[category] && groupedTools[category].length > 0 && (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-6">{category === 'Text & AI' ? 'Text & AI Tools' : `${category} Tools`}</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupedTools[category].map((tool) => (
                      <ToolCard key={tool.name} tool={tool} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


'use client';
import { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreVertical, Edit, Trash2, Search, Wand2, Save, Upload, FileCode, Loader2 } from "lucide-react";
import { type Tool, ToolCategory, tools as masterToolList } from '@/lib/tools';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToolManager } from '@/hooks/useToolManager';
import { useToast } from '@/hooks/use-toast';

export default function AdminToolsPage() {
  const { managedTools, isLoading, toggleToolStatus } = useToolManager();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<ToolCategory | 'All'>('All');
  const { toast } = useToast();

  const categories: ToolCategory[] = ['Image', 'PDF', 'Text & AI', 'Premium'];

  const filteredAndGroupedTools = useMemo(() => {
    const filtered = managedTools.filter(tool => {
        const categoryMatch = filter === 'All' || tool.category === filter;
        const searchMatch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch;
    });

    return filtered.reduce((acc, tool) => {
      const category = tool.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    }, {} as Record<ToolCategory, (Tool & { enabled: boolean })[]>);

  }, [managedTools, searchTerm, filter]);


  const displayedCategories = filter === 'All' 
    ? categories 
    : categories.filter(c => c === filter);
    
  const handleToggle = async (toolPath: string, currentStatus: boolean) => {
    try {
      await toggleToolStatus(toolPath, !currentStatus);
      toast({
        title: 'Status Updated',
        description: `Successfully ${!currentStatus ? 'enabled' : 'disabled'} the tool.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tool status.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold">Tool Management</h1>
            <p className="text-admin-muted-foreground">Manage and reorder the tools available on the website.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted-foreground" />
          <Input 
              placeholder="Search tools..." 
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center gap-2 overflow-x-auto p-1">
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
      </div>

      {isLoading ? (
         <div className="flex justify-center p-10">
           <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      ) : Object.keys(filteredAndGroupedTools).length > 0 ? (
        <div className="space-y-8">
            {displayedCategories.map(category => (
                filteredAndGroupedTools[category] && filteredAndGroupedTools[category].length > 0 && (
                    <div key={category}>
                        <h2 className="text-2xl font-semibold mb-4">{category} Tools</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndGroupedTools[category].map((tool) => (
                                <Card key={tool.path} className="flex flex-col">
                                  <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                                      <div className={cn('p-3 rounded-lg', tool.color.replace('text-', 'bg-') + '/10')}>
                                          <tool.icon className={cn("h-6 w-6", tool.color)} />
                                      </div>
                                  </CardHeader>
                                  <CardContent className="flex-1 flex flex-col justify-between">
                                      <div>
                                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                                        <CardDescription className="mt-1 text-sm">{tool.description}</CardDescription>
                                      </div>
                                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                          <Switch 
                                              checked={tool.enabled}
                                              onCheckedChange={() => handleToggle(tool.path, tool.enabled)}
                                              id={`switch-${tool.path}`}
                                          />
                                          <label htmlFor={`switch-${tool.path}`} className="text-sm font-medium">{tool.enabled ? 'Enabled' : 'Disabled'}</label>
                                        </div>
                                        {tool.isAi && <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">AI</Badge>}
                                      </div>
                                  </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-6">
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-admin-muted/30">
                    <Search className="mx-auto h-12 w-12 text-admin-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Tools Found</h3>
                    <p className="mt-2 text-sm text-admin-muted-foreground">Your search for "{searchTerm}" did not match any tools.</p>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { tools, Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Tool[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      router.push(suggestions[0].path);
    } else if (searchTerm) {
      router.push(`/tools?q=${searchTerm}`);
    }
  };

  const handleSuggestionClick = () => {
    setSearchTerm('');
    setIsFocused(false);
  }

  return (
    <div className="relative w-full max-w-xl mx-auto" ref={searchContainerRef}>
      <form onSubmit={handleSearch} className="relative group flex items-center w-full bg-white/80 dark:bg-black/20 backdrop-blur-md border border-primary/20 rounded-full shadow-lg hover:shadow-primary/20 hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 p-1">
        <SearchIcon className="ml-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="search"
          placeholder="Search for a tool..."
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-12 px-4 placeholder:text-muted-foreground/70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        <button type="submit" className="bg-primary text-white rounded-full p-2.5 hover:bg-primary/90 transition-colors shadow-md m-1">
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      {isFocused && (searchTerm || suggestions.length > 0) && (
        <Card className="absolute top-full mt-2 w-full rounded-xl shadow-lg z-50">
          <CardContent className="p-2">
            {suggestions.length > 0 ? (
              <ul className="space-y-1">
                {suggestions.map((tool) => (
                  <li key={tool.path}>
                    <li key={tool.path}>
                      {tool.isComingSoon ? (
                        <div className="flex items-center gap-4 p-3 rounded-lg opacity-60 cursor-not-allowed bg-muted/30">
                          <div className={cn('p-2 rounded-lg bg-muted/50', tool.color)}>
                            <tool.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{tool.name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-muted-foreground/30 text-muted-foreground">Coming Soon</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={tool.path}
                          onClick={handleSuggestionClick}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className={cn('p-2 rounded-lg bg-muted/50', tool.color)}>
                            <tool.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{tool.name}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      )}
                    </li>
                  </li>
                ))}
              </ul>
            ) : (
              searchTerm && <p className="p-4 text-center text-sm text-muted-foreground">No tools found for &quot;{searchTerm}&quot;</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

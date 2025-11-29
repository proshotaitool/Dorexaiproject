
import Link from 'next/link';
import type { Tool } from '@/lib/tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowRight, Gem } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const isPremium = tool.category === 'Premium';

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (tool.isComingSoon) {
      return <div className="group block h-full opacity-60 cursor-not-allowed">{children}</div>;
    }
    return (
      <Link href={tool.path} className="group block h-full">
        {children}
      </Link>
    );
  };

  return (
    <CardWrapper>
      <Card className={cn(
        "h-full transition-all duration-300 ease-in-out",
        !tool.isComingSoon && "hover:shadow-lg hover:-translate-y-1",
        isPremium 
          ? "border-amber-400/50" 
          : "hover:border-primary/50",
        tool.isComingSoon && "bg-muted/50"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className={cn('p-2 rounded-lg bg-muted', 
              isPremium ? 'text-amber-500' : tool.color
            )}>
              <tool.icon className="h-6 w-6" />
            </div>
            <div className='flex gap-2'>
              {tool.isAi && <Badge variant="outline" className="border-purple-500/50 text-purple-600">AI</Badge>}
              {isPremium && !tool.isComingSoon && <Badge variant="secondary" className="border-amber-400/80 bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"><Gem className="mr-1 h-3 w-3"/>Pro</Badge>}
              {tool.isComingSoon && <Badge variant="outline">Coming Soon</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg font-semibold">{tool.name}</CardTitle>
          <CardDescription className="mt-1 text-sm">{tool.description}</CardDescription>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}

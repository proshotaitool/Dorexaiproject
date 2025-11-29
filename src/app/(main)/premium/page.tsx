
'use client';

import { Button } from '@/components/ui/button';
import { ToolCard } from '@/components/tool-card';
import { tools } from '@/lib/tools';
import { Gem, Sparkles } from 'lucide-react';
import Link from 'next/link';

const premiumTools = tools.filter(tool => tool.category === 'Premium');

export default function PremiumPage() {
  return (
    <div className="bg-gradient-to-b from-background to-amber-50/50 dark:to-gray-900/50">
      <div className="container py-16 md:py-24">
        <div className="text-center mb-12 max-w-3xl mx-auto">
            <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full mb-4">
                <Gem className="h-10 w-10 text-white" />
            </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Unlock Your Full Potential
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Supercharge your workflow with exclusive premium tools, priority processing, and an ad-free experience.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full shadow-lg hover:scale-105 hover:shadow-primary/30 transition-transform duration-300 active:scale-95">
            <Link href="/pricing">Upgrade to Pro</Link>
          </Button>
        </div>

        {premiumTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {premiumTools.map((tool) => (
              <ToolCard key={tool.path} tool={tool} />
            ))}
          </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">More Premium Tools Coming Soon</h3>
                <p className="mt-2 text-sm text-muted-foreground">We're working on exciting new features. Stay tuned!</p>
            </div>
        )}

         <div className="mt-24 bg-primary/5 dark:bg-primary/10 rounded-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Go Pro?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of professionals who are saving time and creating amazing work with DoreX Ai's full suite of tools.
          </p>
          <Button asChild size="lg" className="rounded-full shadow-lg hover:scale-105 hover:shadow-primary/30 transition-transform duration-300 active:scale-95 h-12 px-10 text-base">
            <Link href="/pricing">View Pricing Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

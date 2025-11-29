
'use client';

import { Tool } from '@/lib/tools';
import { ToolCard } from './tool-card';

export function RelatedTools({ tools }: { tools: Tool[] }) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tighter">Related Tools</h2>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Explore other tools that might be useful for your project.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {tools.map((tool) => (
          <ToolCard key={tool.path} tool={tool} />
        ))}
      </div>
    </section>
  );
}

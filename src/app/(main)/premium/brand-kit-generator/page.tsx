'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Palette, Type, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function BrandKitGeneratorPage() {
  return (
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
              <BreadcrumbLink href="/premium">Premium Tools</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Brand Kit Generator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
         <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full mb-4">
            <Gem className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">AI Brand Kit Generator</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Instantly create a complete brand identity. Generate professional logos, harmonious color palettes, and elegant font pairings in seconds with AI. This premium feature is coming soon.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
         <CardHeader>
            <CardTitle>Feature Coming Soon!</CardTitle>
            <CardDescription>The AI Brand Kit Generator is in the works and will be a part of our Pro plan. Upgrade today to get access as soon as it launches.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
            <div className="p-8 border-2 border-dashed rounded-xl bg-muted/50">
                <h3 className="text-xl font-semibold">Build Your Brand in Minutes, Not Weeks</h3>
                <p className="text-muted-foreground mt-2 mb-6">Describe your business, and our AI will generate a complete brand kit tailored to your industry and style. Be the first to try it by upgrading to Pro.</p>
                <Button asChild className="h-12 text-lg">
                    <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
            </div>

            <div className="text-left space-y-4">
                <h3 className="text-lg font-semibold">What you'll get with the Brand Kit Generator:</h3>
                <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Custom Logos:</span> Generate dozens of unique, professional logo designs based on your company name and style preferences.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Color Palettes:</span> Get perfectly matched color schemes that reflect your brand's personality, complete with hex codes.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Font Pairings:</span> Discover elegant and readable font combinations for your headlines and body text.</span>
                    </li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Droplet, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function WatermarkRemoverPage() {
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
              <BreadcrumbPage>AI Watermark Remover</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
         <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full mb-4">
            <Gem className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">AI Watermark Remover</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Automatically remove watermarks from images using advanced AI, intelligently reconstructing the area behind the mark. This premium feature is coming soon.
        </p>
      </div>

       <Card className="max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle>Feature Coming Soon!</CardTitle>
            <CardDescription>Our AI Watermark Remover is a powerful upcoming feature for Pro users. Upgrade to be the first to try it out.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
            <div className="p-8 border-2 border-dashed rounded-xl bg-muted/50">
                <h3 className="text-xl font-semibold">Clean Up Your Images in Seconds</h3>
                <p className="text-muted-foreground mt-2 mb-6">Remove distracting logos, text, or date stamps from your photos to restore their original look. Upgrade to Pro and get ready for this powerful tool.</p>
                <Button asChild className="h-12 text-lg">
                    <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
            </div>

            <div className="text-left space-y-4">
                <h3 className="text-lg font-semibold">How our AI Watermark Remover will work:</h3>
                <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Smart Detection:</span> Our AI will automatically identify and locate watermarks on your image.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Content-Aware Fill:</span> The AI intelligently reconstructs the background behind the watermark, creating a seamless and natural result.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">High-Quality Output:</span> Get a clean, high-resolution image with no trace of the original watermark.</span>
                    </li>
                </ul>
                <p className="text-xs text-muted-foreground pt-4">Please note: This tool is intended for use on images you own or have the right to modify. Respect copyright.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

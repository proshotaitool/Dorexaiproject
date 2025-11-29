'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, PenTool, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function SecureDocumentSigningPage() {
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
              <BreadcrumbPage>Secure Document Signing</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
         <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full mb-4">
            <Gem className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Secure Document Signing</h1>
        <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
          Digitally sign your PDF documents with legally-binding, encrypted signatures. This premium feature is coming soon.
        </p>
      </div>

       <Card className="max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle>Feature Coming Soon!</CardTitle>
            <CardDescription>Our Secure Document Signing tool is under development and will be available to Pro users. Upgrade your plan to get early access.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center space-y-6">
            <div className="p-8 border-2 border-dashed rounded-xl bg-muted/50">
                <h3 className="text-xl font-semibold">Sign and Send Documents with Confidence</h3>
                <p className="text-muted-foreground mt-2 mb-6">Stop printing and scanning. Our upcoming tool will allow you to sign and manage important documents entirely online, securely and efficiently.</p>
                <Button asChild className="h-12 text-lg">
                    <Link href="/pricing">Upgrade to Pro</Link>
                </Button>
            </div>

            <div className="text-left space-y-4">
                <h3 className="text-lg font-semibold">Why you'll love our Document Signing tool:</h3>
                <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Legally Binding:</span> Create e-signatures that are compliant with global e-signature laws.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Bank-Grade Security:</span> Your documents will be protected with end-to-end encryption to ensure privacy and integrity.</span>
                    </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span><span className="font-semibold text-foreground">Audit Trail:</span> Track every action taken on your document, from viewing to signing, with a comprehensive audit trail.</span>
                    </li>
                </ul>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

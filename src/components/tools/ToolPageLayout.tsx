'use client';

import React, { useState, useEffect } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle } from 'lucide-react';
import { RelatedTools } from '@/components/related-tools';
import { tools } from '@/lib/tools';
import { AdsterraAds } from '@/components/ads/AdsterraAds';

export interface Feature {
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
}

export interface Step {
    title: string;
    description: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

interface ToolPageLayoutProps {
    title: string;
    description: string;
    toolName: string; // Used for identifying the tool in lists/favorites if needed
    children: React.ReactNode;
    features: Feature[];
    steps: Step[];
    faqs: FAQ[];
    aboutTitle?: string;
    aboutDescription: string | React.ReactNode;
    relatedTools?: string[]; // Array of tool paths or names
    category?: string; // For breadcrumb and auto-related tools
}

export function ToolPageLayout({
    title,
    description,
    toolName,
    children,
    features,
    steps,
    faqs,
    aboutTitle,
    aboutDescription,
    relatedTools: specificRelatedTools,
    category = 'Tools',
}: ToolPageLayoutProps) {
    const [showAds, setShowAds] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAds(true);
        }, 15000); // 15 seconds delay

        return () => clearTimeout(timer);
    }, []);

    // Determine related tools
    const relatedToolsList = specificRelatedTools
        ? tools.filter((t) => specificRelatedTools.includes(t.path) || specificRelatedTools.includes(t.name))
        : tools.filter((t) => t.category === category && t.name !== toolName).slice(0, 4);

    return (
        <div className="container py-12 relative">
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
                            {/* Assuming category link exists, otherwise just text or redirect to tools */}
                            <BreadcrumbLink href={`/tools#${category.toLowerCase()}`}>{category}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{toolName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">{title}</h1>
                <p className="mt-2 text-muted-foreground md:text-lg max-w-2xl mx-auto">
                    {description}
                </p>
            </div>

            {/* Main Tool Area */}
            <div className="mb-16 relative">
                {/* Top Ad - Show after 15s */}
                {showAds && (
                    <div className="mb-8 flex justify-center">
                        <AdsterraAds type="banner_468x60" />
                    </div>
                )}

                {children}

                {/* Bottom Ad - Show after 15s */}
                {showAds && (
                    <div className="mt-8 flex justify-center">
                        <AdsterraAds type="banner_300x250" />
                    </div>
                )}
            </div>

            <section className="mt-16 space-y-8 max-w-4xl mx-auto">
                {/* Middle Ad - Show after 15s */}
                {showAds && (
                    <div className="flex justify-center my-8">
                        <AdsterraAds type="native_banner" />
                    </div>
                )}

                {/* About Section */}
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">{aboutTitle || `About ${toolName}`}</h2>
                        <div className="text-muted-foreground leading-relaxed">
                            {aboutDescription}
                        </div>
                    </CardContent>
                </Card>

                {/* How To Section */}
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">How to {toolName}</h2>
                        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                            {steps.map((step, index) => (
                                <li key={index}>
                                    <span className="font-semibold text-foreground">{step.title}:</span> {step.description}
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>

                {/* Features Section */}
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Features & Benefits</h2>
                        <ul className="space-y-4 text-muted-foreground">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">{feature.title}:</span> {feature.description}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions (FAQ)</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </section>

            {/* Related Tools */}
            <div className="mt-16">
                <RelatedTools tools={relatedToolsList} />
            </div>

            {/* Sticky Social Bar Ad - Show after 15s */}
            {showAds && <AdsterraAds type="social_bar" />}
        </div>
    );
}

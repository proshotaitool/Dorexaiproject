
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, X, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const features = [
  { name: 'Daily Credits', free: '100 / day', pro: 'Unlimited', business: 'Unlimited' },
  { name: 'Image Tool Access', free: 'Basic access', pro: 'Full access', business: 'Full access' },
  { name: 'PDF Tool Access', free: 'Basic access', pro: 'Full access', business: 'Full access' },
  { name: 'AI Tool Access', free: 'Limited use', pro: 'Unlimited use', business: 'Unlimited use' },
  { name: 'File Processing Speed', free: 'Standard', pro: 'Priority', business: 'Highest Priority' },
  { name: 'Premium Tools', free: false, pro: true, business: true },
  { name: 'Ad-Free Experience', free: false, pro: true, business: true },
  { name: 'Customer Support', free: 'Standard', pro: 'Priority Email', business: 'Dedicated Support' },
  { name: 'API Access', free: false, pro: false, business: true },
  { name: 'Team Management', free: false, pro: false, business: true },
];

const faqs = [
    {
        question: "Can I cancel my subscription at any time?",
        answer: "Yes, you can cancel your Pro subscription at any time from your profile page. Your access will continue until the end of your current billing period, and you won't be charged again."
    },
    {
        question: "What happens if I use all my daily credits on the Free plan?",
        answer: "If you use all 100 of your free daily credits, you'll need to wait until the next day for them to reset. To continue using the tools without interruption, you can upgrade to the Pro plan for unlimited usage."
    },
    {
        question: "Do you offer discounts for students or non-profits?",
        answer: "We believe in supporting education and non-profit organizations. Please contact our support team from your official email address, and we'll be happy to discuss potential discounts."
    },
     {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, including Visa, Mastercard, and American Express, as well as PayPal. All payments are processed securely through our payment partner, Stripe."
    },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="bg-gradient-to-b from-primary/5 to-background">
      <div className="container py-16 md:py-24">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Choose the perfect plan for your needs. Get started for free, no credit card required.
          </p>
        </div>

        <div className="flex justify-center items-center space-x-4 mb-12">
          <span className={cn("font-medium", !isYearly && "text-primary")}>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} id="billing-toggle" disabled/>
          <span className={cn("font-medium", isYearly && "text-primary")}>Yearly</span>
          <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">Save 17%</div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold">Free</CardTitle>
              <CardDescription className="pt-2 min-h-[40px]">Perfect for individuals and occasional use.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Basic Image & PDF Tools</li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> 100 Daily Credits</li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Standard processing</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full h-11 text-base" asChild><Link href="/signup">Get Started</Link></Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-2 border-primary ring-4 ring-primary/10 shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-12 py-1 text-sm font-semibold transform rotate-45 translate-x-12 translate-y-4 shadow-lg">Popular</div>
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl font-bold flex items-center gap-2">Pro <Badge variant="outline">Coming Soon</Badge></CardTitle>
              <CardDescription className="pt-2 min-h-[40px]">For professionals and power users who need more.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-5xl font-bold">{isYearly ? '$8' : '$10'}</span>
                <span className="text-muted-foreground">/month</span>
                {isYearly && <p className="text-sm text-muted-foreground mt-1">Billed as $96 per year</p>}
              </div>
              <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Unlimited access to all tools</li>
                  <li className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Unlimited Daily Credits</li>
                  <li className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Priority processing queue</li>
                  <li className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Ad-free experience</li>
                  <li className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Priority customer support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-11 text-base transition-transform hover:scale-105" disabled>Go Pro</Button>
            </CardFooter>
          </Card>

          {/* Business Plan */}
          <Card className="flex flex-col border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">Business <Badge variant="outline">Coming Soon</Badge></CardTitle>
              <CardDescription className="pt-2 min-h-[40px]">For teams and enterprises requiring more.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-5xl font-bold">Custom</span>
              </div>
              <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Everything in Pro</li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Team management features</li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> API access</li>
                  <li className="flex items-center gap-3"><Check className="h-5 w-5 text-primary" /> Dedicated account manager</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full h-11 text-base" disabled>Contact Sales</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-24">
          <h2 className="text-center text-3xl font-bold mb-8">Full Feature Comparison</h2>
          <Card className="hidden md:block max-w-5xl mx-auto shadow-lg">
             <div className="border rounded-lg">
                <div className="grid grid-cols-4 p-4 font-semibold sticky top-0 bg-background/80 backdrop-blur-sm border-b">
                  <div className="font-bold text-lg">Feature</div>
                  <div className="text-center font-bold text-lg">Free</div>
                  <div className="text-center font-bold text-lg text-primary">Pro (Coming Soon)</div>
                  <div className="text-center font-bold text-lg">Business (Coming Soon)</div>
                </div>
                {features.map((feature, index) => (
                  <div key={feature.name} className={cn("grid grid-cols-4 p-4 items-center", index % 2 === 1 ? "bg-muted/50" : "")}>
                    <div>{feature.name}</div>
                    <div className="text-center">
                      {typeof feature.free === 'boolean' ? (feature.free ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : <span className="text-muted-foreground text-sm">{feature.free}</span>}
                    </div>
                     <div className="text-center">
                      {typeof feature.pro === 'boolean' ? (feature.pro ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : <span className="text-muted-foreground text-sm font-semibold">{feature.pro}</span>}
                    </div>
                    <div className="text-center">
                      {typeof feature.business === 'boolean' ? (feature.business ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />) : <span className="text-muted-foreground text-sm font-semibold">{feature.business}</span>}
                    </div>
                  </div>
                ))}
             </div>
          </Card>
          <div className="md:hidden">
              <Accordion type="single" collapsible className="w-full">
                {features.map((feature) => (
                   <AccordionItem value={feature.name} key={feature.name}>
                      <AccordionTrigger>{feature.name}</AccordionTrigger>
                      <AccordionContent>
                         <div className="grid grid-cols-1 gap-4 text-sm px-4">
                            <div>
                                <h4 className="font-semibold mb-2">Free</h4>
                                <p className="text-muted-foreground">{typeof feature.free === 'boolean' ? (feature.free ? "Included" : "Not Included") : feature.free}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Pro (Coming Soon)</h4>
                                <p className="text-muted-foreground">{typeof feature.pro === 'boolean' ? (feature.pro ? "Included" : "Not Included") : feature.pro}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2">Business (Coming Soon)</h4>
                                <p className="text-muted-foreground">{typeof feature.business === 'boolean' ? (feature.business ? "Included" : "Not Included") : feature.business}</p>
                            </div>
                         </div>
                      </AccordionContent>
                   </AccordionItem>
                ))}
              </Accordion>
          </div>
        </div>

        <div className="mt-24 bg-muted/50 rounded-xl p-8 md:p-12">
          <h2 className="text-center text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="bg-background rounded-lg shadow-sm px-6 mb-4">
                <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

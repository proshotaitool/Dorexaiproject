import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, LifeBuoy, Book, CreditCard, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find answers to common questions, tutorials, and tips for getting the most out of DoreX Ai.',
};


const faqs = {
    "Getting Started": [
        {
            icon: Book,
            question: "How do I create an account?",
            answer: "You can create an account by clicking the 'Sign Up' button on the homepage. You can sign up using your email and a password, or with your Google account."
        },
        {
            icon: CreditCard,
            question: "How do the credits work?",
            answer: "You receive 100 free credits every day. Most AI-powered or intensive tasks consume one credit per use. Unused credits expire at the end of the day. You can upgrade to a Pro plan for unlimited usage."
        }
    ],
    "Billing & Subscriptions": [
        {
            icon: CreditCard,
            question: "Can I cancel my subscription at any time?",
            answer: "Yes, you can cancel your Pro subscription at any time from your profile page. Your access will continue until the end of your current billing period, and you won't be charged again."
        },
        {
            icon: CreditCard,
            question: "What payment methods do you accept?",
            answer: "We accept all major credit cards, including Visa, Mastercard, and American Express. All payments are processed securely through our payment partner, Stripe."
        }
    ],
    "Using the Tools": [
        {
            icon: LifeBuoy,
            question: "Are my uploaded files secure?",
            answer: "Absolutely. We prioritize your privacy and security. Files you upload are processed securely and are automatically deleted from our servers after a short period. We do not access or share the content of your files."
        },
        {
            icon: LifeBuoy,
            question: "Why did my file fail to process?",
            answer: "File processing can sometimes fail due to unsupported formats, file corruption, or network issues. Please ensure your file is in a supported format and try again. If the problem persists, please contact our support team."
        }
    ]
}

export default function HelpCenterPage() {
    return (
        <div>
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-100 via-cyan-100 to-white animate-gradient"></div>
                <div 
                  className="absolute inset-0 -z-10 bg-grid-slate-900/[0.04]"
                  style={{ backgroundPosition: '10px 10px' }}
                ></div>
                <div className="container mx-auto px-4 py-16 sm:py-24 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                        How Can We Help?
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
                        Find answers to common questions, tutorials, and tips for getting the most out of DoreX Ai.
                    </p>
                    <div className="mt-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                            <Input placeholder="Search for answers..." className="w-full h-14 pl-12 rounded-full shadow-lg text-lg"/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container -mt-16 pb-16">
                 <Card className="max-w-4xl mx-auto shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {Object.entries(faqs).map(([category, questions]) => (
                            <div key={category} className="mb-10 last:mb-0">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                       {category === 'Getting Started' ? <Book/> : category === 'Billing & Subscriptions' ? <CreditCard/> : <LifeBuoy/>}
                                    </div>
                                    {category}
                                </h2>
                                <Accordion type="single" collapsible className="w-full space-y-3">
                                    {questions.map((faq, index) => (
                                    <AccordionItem value={`item-${category}-${index}`} key={index} className="bg-muted/30 rounded-lg px-6 border-b-0">
                                        <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                                        <AccordionContent className="text-base text-muted-foreground pt-2">
                                        {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <div className="text-center mt-12">
                    <h3 className="text-2xl font-semibold">Can't Find Your Answer?</h3>
                    <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Our support team is here to help. Reach out to us and we'll get back to you as soon as possible.</p>
                    <Button asChild className="mt-6">
                        <Link href="/contact"><Mail className="mr-2"/> Contact Support</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
